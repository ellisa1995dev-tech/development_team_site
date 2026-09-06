import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './orders.dto';
import { AdminGuard } from '../auth/admin.guard';
import { UserGuard, type UserTokenPayload } from '../users/user.guard';
import {
  MAX_UPLOAD_BYTES,
  INLINE_VIEWABLE,
  assertAllowedDocument,
  safeFilename,
  type UploadedDocument,
} from './attachments';

@Controller('orders')
export class OrdersPublicController {
  constructor(private readonly orders: OrdersService) {}

  /**
   * Requires a registered account — the guard rejects anonymous posts.
   *
   * Accepts multipart/form-data so a requirements document can arrive with
   * the brief in one request. `stack` comes through as a JSON string because
   * form fields are flat.
   */
  @Post()
  @UseGuards(UserGuard)
  @UseInterceptors(
    FileInterceptor('document', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  )
  async create(
    @Body() dto: CreateOrderDto,
    @Req() req: Request & { user?: UserTokenPayload },
    @UploadedFile() document?: UploadedDocument,
  ) {
    if (document) assertAllowedDocument(document);
    return this.orders.create(dto, req.user!.sub, document);
  }
}

@Controller('admin/orders')
@UseGuards(AdminGuard)
export class OrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query('status') status?: OrderStatus) {
    return this.orders.findAll(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orders.remove(id);
  }

  /**
   * Streams an attachment back.
   *
   * `?disposition=inline` renders PDFs and images in the browser; anything
   * else downloads. The admin UI fetches this with its bearer token and turns
   * the response into a blob URL, so no token ever lands in a query string.
   */
  @Get(':id/attachments/:attachmentId')
  async download(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Query('disposition') disposition: string | undefined,
    @Res() res: Response,
  ) {
    const file = await this.orders.findAttachment(id, attachmentId);
    if (!file) throw new NotFoundException('Attachment not found');

    const inline = disposition === 'inline' && INLINE_VIEWABLE.has(file.mimeType);
    const name = safeFilename(file.filename);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.sizeBytes));
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${name}"`);
    // These are private client documents; never let a proxy hold a copy.
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(Buffer.from(file.data));
  }

  @Delete(':id/attachments/:attachmentId')
  removeAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.orders.removeAttachment(id, attachmentId);
  }

  /** Lets an admin attach a document to an existing order. */
  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('document', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  async addAttachment(@Param('id') id: string, @UploadedFile() document?: UploadedDocument) {
    if (!document) throw new BadRequestException('No file was uploaded.');
    assertAllowedDocument(document);
    return this.orders.addAttachment(id, document);
  }
}
