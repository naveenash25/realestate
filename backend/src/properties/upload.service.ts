import { Injectable, BadRequestException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_DOC_SIZE_MB = 10;
const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class UploadService {
  private storage = new Storage({
    keyFilename: process.env.GCS_SERVICE_ACCOUNT_KEY,
  });
  private bucket = this.storage.bucket(process.env.GCS_BUCKET_NAME!);

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(`Image must be under ${MAX_SIZE_MB}MB`);
    }

    const ext = file.originalname.split('.').pop();
    const filename = `properties/${randomUUID()}.${ext}`;
    const blob = this.bucket.file(filename);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });
    await blob.makePublic();

    return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filename}`;
  }

  // Ownership documents (sale deed, Aadhaar/PAN, etc.) are real PII — unlike
  // property photos, the GCS object stays private; callers read it back via
  // getSignedReadUrl() instead of a permanent public URL.
  async uploadDocument(
    file: Express.Multer.File,
    propertyId: string,
  ): Promise<{ path: string; mimeType: string; size: number; originalName: string }> {
    if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and PDF files are allowed');
    }
    if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(`Document must be under ${MAX_DOC_SIZE_MB}MB`);
    }

    const ext = file.originalname.split('.').pop();
    const path = `property-documents/${propertyId}/${randomUUID()}.${ext}`;
    await this.bucket.file(path).save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });

    return {
      path,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  async getSignedReadUrl(path: string): Promise<string> {
    const [url] = await this.bucket.file(path).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });
    return url;
  }
}
