import { Injectable, BadRequestException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

@Injectable()
export class UploadService {
  private storage = new Storage({
    keyFilename: process.env.GCS_SERVICE_ACCOUNT_KEY,
  });
  private bucket = this.storage.bucket(process.env.GCS_BUCKET_NAME!);

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(`Image must be under ${MAX_SIZE_MB}MB`);
    }

    const ext = file.originalname.split('.').pop();
    const filename = `properties/${randomUUID()}.${ext}`;
    const blob = this.bucket.file(filename);

    await blob.save(file.buffer, { contentType: file.mimetype, resumable: false });
    await blob.makePublic();

    return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filename}`;
  }
}
