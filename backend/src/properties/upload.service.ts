import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER, type StorageProvider } from './interfaces/storage-provider.interface';

@Injectable()
export class UploadService {
  constructor(@Inject(STORAGE_PROVIDER) private storage: StorageProvider) {}

  uploadImage(file: Express.Multer.File) {
    return this.storage.uploadImage(file);
  }

  uploadDocument(file: Express.Multer.File, propertyId: string) {
    return this.storage.uploadDocument(file, propertyId);
  }

  getSignedReadUrl(path: string) {
    return this.storage.getSignedReadUrl(path);
  }
}
