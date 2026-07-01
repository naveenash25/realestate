import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/roles.guard';
import { UploadService } from '../properties/upload.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, RolesGuard, UploadService],
})
export class AdminModule {}
