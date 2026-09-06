import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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
        // Metadata only: the blobs would make this response enormous.
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

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.projectOrder.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Attachments cascade with the order.
    await this.prisma.projectOrder.delete({ where: { id } });
    return { deleted: true };
  }

  /** Loads one attachment including its bytes, scoped to its order. */
  findAttachment(orderId: string, attachmentId: string) {
    return this.prisma.orderAttachment.findFirst({
      where: { id: attachmentId, orderId },
    });
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
    const { count } = await this.prisma.orderAttachment.deleteMany({
      where: { id: attachmentId, orderId },
    });
    if (count === 0) throw new NotFoundException('Attachment not found');
    return { deleted: true };
  }
}
