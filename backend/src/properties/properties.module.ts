import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } })],
  controllers: [PropertiesController],
  providers: [PropertiesService, UploadService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
