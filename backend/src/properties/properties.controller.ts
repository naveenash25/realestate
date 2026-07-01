import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request, UploadedFiles, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  update(@Param('id') id: string, @Request() req: any, @Body() dto: Partial<CreatePropertyDto>) {
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
    @UploadedFiles(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
      ],
    })) files: Express.Multer.File[],
  ) {
    const urls = await Promise.all(files.map(f => this.uploadService.uploadImage(f)));
    const media = urls.map((url, i) => ({ type: 'image', url, sort_order: i }));
    return this.propertiesService.addMedia(id, req.user.id, media);
  }

  // Add video links (Instagram Reel or YouTube)
  @UseGuards(JwtAuthGuard)
  @Post(':id/media/videos')
  addVideos(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { videos: { type: 'instagram_reel' | 'youtube'; url: string }[] },
  ) {
    const media = body.videos.map((v, i) => ({ ...v, sort_order: i }));
    return this.propertiesService.addMedia(id, req.user.id, media);
  }
}
