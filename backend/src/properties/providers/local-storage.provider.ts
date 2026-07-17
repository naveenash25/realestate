import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { StorageProvider, UploadedDocument } from '../interfaces/storage-provider.interface';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_DOC_SIZE_MB = 10;

// Dev-only fallback used when no real cloud storage is configured
// (STORAGE_DRIVER=local, the default). Files land under backend/uploads/,
// served back over HTTP by main.ts's static assets middleware. Swap to
// STORAGE_DRIVER=gcs once real GCS credentials are available — no other
// code changes needed, since callers only ever depend on StorageProvider.
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private uploadsDir = join(process.cwd(), 'uploads');
  private baseUrl = process.env.BACKEND_URL || 'http://localhost:8080';

  private async save(subpath: string, buffer: Buffer): Promise<void> {
    const fullPath = join(this.uploadsDir, subpath);
    await mkdir(join(fullPath, '..'), { recursive: true });
    await writeFile(fullPath, buffer);
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(`Image must be under ${MAX_SIZE_MB}MB`);
    }

    const ext = file.originalname.split('.').pop();
    const subpath = `properties/${randomUUID()}.${ext}`;
    await this.save(subpath, file.buffer);

    return `${this.baseUrl}/uploads/${subpath}`;
  }

  async uploadDocument(file: Express.Multer.File, propertyId: string): Promise<UploadedDocument> {
    if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and PDF files are allowed');
    }
    if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(`Document must be under ${MAX_DOC_SIZE_MB}MB`);
    }

    const ext = file.originalname.split('.').pop();
    const subpath = `property-documents/${propertyId}/${randomUUID()}.${ext}`;
    await this.save(subpath, file.buffer);

    return {
      path: subpath,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  async getSignedReadUrl(path: string): Promise<string> {
    // No real signing locally — the dev server isn't exposed to the internet.
    return `${this.baseUrl}/uploads/${path}`;
  }
}
