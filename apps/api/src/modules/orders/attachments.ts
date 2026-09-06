import { BadRequestException } from '@nestjs/common';

/**
 * Vercel caps a serverless request body at 4.5 MB, so anything larger cannot
 * reach us regardless of what we allow. 4 MB leaves room for the form fields.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Document formats a client would plausibly send a requirements brief in. */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.oasis.opendocument.text': 'odt',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** Formats a browser can render inline rather than forcing a download. */
export const INLINE_VIEWABLE = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
]);

export interface UploadedDocument {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Strips any directory component, control characters, quotes and backslashes
 * from a client-supplied filename.
 *
 * The value is only ever a label and a Content-Disposition parameter — never a
 * filesystem path — but an unescaped quote there would let a crafted name break
 * out of the header value.
 */
export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'document';
  const cleaned = base.replace(/[\u0000-\u001f\u007f"\\]/g, '').trim();
  return (cleaned || 'document').slice(0, 200);
}

export function assertAllowedDocument(file: UploadedDocument): void {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    throw new BadRequestException(
      `Unsupported file type "${file.mimetype}". Accepted: PDF, Word, ODT, text, Markdown, CSV, Excel, PNG, JPEG, WebP.`,
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new BadRequestException(
      `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
    );
  }
  if (file.size === 0) {
    throw new BadRequestException('The uploaded file is empty.');
  }
}
