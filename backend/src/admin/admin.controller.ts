import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';
import { UploadService } from '../properties/upload.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly uploadService: UploadService,
  ) {}

  // ── Admin-only routes ──────────────────────────────────────────

  @Roles('admin')
  @Get('owners/pending')
  getPendingOwners() {
    return this.adminService.getPendingOwners();
  }

  @Roles('admin')
  @Put('owners/:id/verify')
  verifyOwner(@Param('id') id: string, @Body('approve') approve: boolean) {
    return this.adminService.verifyOwner(id, approve);
  }

  @Roles('admin')
  @Get('pricing')
  getPricing() {
    return this.adminService.getPricingMatrix();
  }

  @Roles('admin')
  @Put('pricing/:id')
  updatePrice(@Param('id') id: string, @Body('price') price: number) {
    return this.adminService.updatePrice(id, price);
  }

  @Roles('admin')
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ── MT (Management Trainee) + Admin routes ────────────────────

  @Roles('admin', 'mt')
  @Get('mt/owners')
  mtListOwners() {
    return this.adminService.mtListOwners();
  }

  @Roles('admin', 'mt')
  @Post('mt/owners')
  @UseInterceptors(FileInterceptor('id_document', { storage: memoryStorage() }))
  async mtRegisterOwner(
    @Body('full_name') fullName: string,
    @Body('phone') phone: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let id_document_url: string | undefined;
    if (file) id_document_url = await this.uploadService.uploadImage(file);
    return this.adminService.mtRegisterOwner({
      full_name: fullName,
      phone,
      id_document_url,
    });
  }

  @Roles('admin', 'mt')
  @Post('mt/owners/:id/properties')
  mtCreateProperty(
    @Param('id') ownerId: string,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.adminService.mtCreateProperty(ownerId, dto);
  }
}
