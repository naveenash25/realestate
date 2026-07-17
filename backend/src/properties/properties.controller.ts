import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UploadedFiles,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PropertiesService } from './properties.service';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  search(@Query() query: SearchPropertyDto) {
    return this.propertiesService.search(query);
  }

  // /mine must be declared before /:id so it isn't captured as a param
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Request() req: any) {
    return this.propertiesService.findByOwner(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: Partial<CreatePropertyDto>,
  ) {
    return this.propertiesService.update(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.remove(id, req.user.id);
  }

  // Upload up to 10 images for a property (max 5MB each)
  @UseGuards(JwtAuthGuard)
  @Post(':id/media/images')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  async uploadImages(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    const urls = await Promise.all(
      files.map((f) => this.uploadService.uploadImage(f)),
    );
    const media = urls.map((url, i) => ({ type: 'image', url, sort_order: i }));
    return this.propertiesService.addMedia(id, req.user.id, media);
  }

  // Add video links (Instagram Reel or YouTube)
  @UseGuards(JwtAuthGuard)
  @Post(':id/media/videos')
  addVideos(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: { videos: { type: 'instagram_reel' | 'youtube'; url: string }[] },
  ) {
    const media = body.videos.map((v, i) => ({ ...v, sort_order: i }));
    return this.propertiesService.addMedia(id, req.user.id, media);
  }

  // Ownership documents (sale deed, encumbrance certificate, Aadhaar/PAN, tax
  // receipt) — uploaded independently per document type from the Add Property
  // wizard's Documents step. Max 10MB each, images or PDF.
  @UseGuards(JwtAuthGuard)
  @Post(':id/documents')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'ownership_deed', maxCount: 1 },
        { name: 'encumbrance_certificate', maxCount: 1 },
        { name: 'identity_proof', maxCount: 1 },
        { name: 'tax_receipt', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } },
    ),
  )
  async uploadDocuments(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    const results: unknown[] = [];
    for (const [type, [file]] of Object.entries(files || {})) {
      const uploaded = await this.uploadService.uploadDocument(file, id);
      const doc = await this.propertiesService.upsertDocument(id, req.user.id, type, uploaded);
      results.push(doc);
    }
    return results;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/documents')
  async listDocuments(@Param('id') id: string, @Request() req: any) {
    const docs = await this.propertiesService.listDocuments(id, req.user.id);
    return Promise.all(
      docs.map(async (doc: any) => ({
        ...doc,
        url: await this.uploadService.getSignedReadUrl(doc.file_path),
      })),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/documents/:type')
  removeDocument(
    @Param('id') id: string,
    @Param('type') type: string,
    @Request() req: any,
  ) {
    return this.propertiesService.removeDocument(id, req.user.id, type);
  }
}
