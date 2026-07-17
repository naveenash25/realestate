import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/roles.guard';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [PropertiesModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
