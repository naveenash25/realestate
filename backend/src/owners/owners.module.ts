import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { UploadService } from '../properties/upload.service';

@Module({
  controllers: [OwnersController],
  providers: [OwnersService, UploadService],
  exports: [OwnersService],
})
export class OwnersModule {}
