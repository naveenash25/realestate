import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OwnersService } from './owners.service';
import { UploadService } from '../properties/upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('owners')
export class OwnersController {
  constructor(
    private readonly ownersService: OwnersService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('me')
  getProfile(@Request() req: any) {
    return this.ownersService.getProfile(req.user.id);
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('id_document', { storage: memoryStorage() }))
  async register(
    @Request() req: any,
    @Body('full_name') fullName: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let documentUrl: string | undefined;
    if (file) documentUrl = await this.uploadService.uploadImage(file);
    return this.ownersService.register(req.user.id, fullName, documentUrl);
  }
}
