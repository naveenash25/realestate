import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { UploadService } from './upload.service';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { GcsStorageProvider } from './providers/gcs-storage.provider';

@Module({
  imports: [MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } })],
  controllers: [PropertiesController],
  providers: [
    PropertiesService,
    UploadService,
    {
      provide: STORAGE_PROVIDER,
      // STORAGE_DRIVER=gcs switches to real Google Cloud Storage once
      // GCS_BUCKET_NAME/GCS_SERVICE_ACCOUNT_KEY point at a real bucket/key.
      useClass: process.env.STORAGE_DRIVER === 'gcs' ? GcsStorageProvider : LocalStorageProvider,
    },
  ],
  exports: [PropertiesService, UploadService],
})
export class PropertiesModule {}
