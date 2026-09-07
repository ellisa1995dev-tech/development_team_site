import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, type Project, type ProjectOrder } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail.service';
import { projectAddedEmail, projectArchivedEmail } from '../../common/mail.templates';
import { CreateOrderDto, UpdateOrderDto } from './orders.dto';
import { safeFilename, type UploadedDocument } from './attachments';

/**
 * Prisma's Bytes column wants a Uint8Array backed by a plain ArrayBuffer.
 * A Buffer's underlying store is typed ArrayBufferLike (it may be shared and
 * is pooled across allocations), so copy into a fresh, exclusively-owned one.
 */
const toBytes = (buf: Buffer): Uint8Array<ArrayBuffer> => new Uint8Array(buf);

/** Attachment fields minus the blob — safe to include in list responses. */
const ATTACHMENT_META = {
  id: true,
  filename: true,
  mimeType: true,
  sizeBytes: true,
  uploadedAt: true,
} as const;

/** Turns an order into a URL-safe, collision-resistant project slug. */
function slugify(input: string, suffix: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'project'}-${suffix.slice(-6).toLowerCase()}`;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateOrderDto, userId: string, document?: UploadedDocument) {
    const order = await this.prisma.projectOrder.create({
      data: {
        ...dto,
        userId,
        ...(document
          ? {
              attachments: {
                create: {
                  filename: safeFilename(document.originalname),
                  mimeType: document.mimetype,
                  sizeBytes: document.size,
                  data: toBytes(document.buffer),
                },
              },
            }
          : {}),
      },
      select: { id: true, createdAt: true, attachments: { select: ATTACHMENT_META } },
    });

    return { id: order.id, createdAt: order.createdAt, attachments: order.attachments };
  }

  findAll(status?: OrderStatus) {
    return this.prisma.projectOrder.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, company: true } },
        attachments: { select: ATTACHMENT_META, orderBy: { uploadedAt: 'asc' } },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.projectOrder.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, company: true } },
        attachments: { select: ATTACHMENT_META, orderBy: { uploadedAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  /**
   * Updating an order can have side effects:
   *
   *   ACCEPTED → the order becomes a project in progress, dated from today,
   *              and the client is emailed to say so.
   *   ARCHIVED → the client is emailed that it has been archived.
   *
   * Both notifications are best-effort. The status change is the operator's
   * intent; a mail failure must not undo it.
   */
  async update(id: string, dto: UpdateOrderDto) {
    const before = await this.findOne(id);
    const updated = await this.prisma.projectOrder.update({ where: { id }, data: dto });

    const becameAccepted = dto.status === OrderStatus.ACCEPTED && before.status !== OrderStatus.ACCEPTED;
    const becameArchived = dto.status === OrderStatus.ARCHIVED && before.status !== OrderStatus.ARCHIVED;

    let project: Project | null = null;
    let notified: { sent: boolean; reason?: string } | null = null;

    if (becameAccepted) {
      project = await this.promoteToProject(updated);
      notified = await this.notifyAccepted(updated, project);
    } else if (becameArchived) {
      notified = await this.notifyArchived(updated);
    }

    return { ...updated, project, notified };
  }

  /**
   * Creates the active project an accepted order becomes.
   *
   * `startedAt` is the moment of acceptance — that is what the client is told
   * in the email and what the board shows. The unique sourceOrderId means
   * re-accepting an order cannot create a second project.
   */
  private async promoteToProject(order: ProjectOrder): Promise<Project | null> {
    const existing = await this.prisma.project.findUnique({ where: { sourceOrderId: order.id } });
    if (existing) return existing;

    const name = order.companyName?.trim()
      ? `${order.companyName.trim()} — ${order.projectType}`
      : `${order.projectType} for ${order.contactName}`;

    try {
      return await this.prisma.project.create({
        data: {
          name: name.slice(0, 160),
          slug: slugify(name, order.id),
          summary: order.description.slice(0, 500),
          description: order.description,
          status: 'ACTIVE',
          domain: order.projectType,
          stack: order.stack,
          clientName: order.companyName ?? order.contactName,
          progress: 0,
          featured: false,
          // Client work stays off the public site until someone publishes it.
          isPublic: false,
          startedAt: new Date(),
          sourceOrderId: order.id,
        },
      });
    } catch (err) {
      this.logger.error(`Could not create a project from order ${order.id}: ${(err as Error).message}`);
      return null;
    }
  }

  private notifyAccepted(order: ProjectOrder, project: Project | null) {
    return this.mail.send(
      projectAddedEmail({
        contactName: order.contactName,
        email: order.email,
        projectName: project?.name ?? order.projectType,
        projectType: order.projectType,
        timeline: order.timeline,
        startedAt: project?.startedAt ?? new Date(),
      }),
    );
  }

  private async notifyArchived(order: ProjectOrder) {
    const project = await this.prisma.project.findUnique({ where: { sourceOrderId: order.id } });
    return this.mail.send(
      projectArchivedEmail({
        contactName: order.contactName,
        email: order.email,
        projectName: project?.name ?? order.projectType,
        projectType: order.projectType,
      }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.projectOrder.delete({ where: { id } });
    return { deleted: true };
  }

  findAttachment(orderId: string, attachmentId: string) {
    return this.prisma.orderAttachment.findFirst({ where: { id: attachmentId, orderId } });
  }

  async addAttachment(orderId: string, document: UploadedDocument) {
    await this.findOne(orderId);
    return this.prisma.orderAttachment.create({
      data: {
        orderId,
        filename: safeFilename(document.originalname),
        mimeType: document.mimetype,
        sizeBytes: document.size,
        data: toBytes(document.buffer),
      },
      select: ATTACHMENT_META,
    });
  }

  async removeAttachment(orderId: string, attachmentId: string) {
    const { count } = await this.prisma.orderAttachment.deleteMany({ where: { id: attachmentId, orderId } });
    if (count === 0) throw new NotFoundException('Attachment not found');
    return { deleted: true };
  }
}
