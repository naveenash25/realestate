import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { EnquiriesService } from './enquiries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  // Buyer submits an enquiry (login required)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreateEnquiryDto) {
    return this.enquiriesService.create(req.user.id, dto);
  }

  // Owner views their received leads
  @UseGuards(JwtAuthGuard)
  @Get()
  findOwnerLeads(@Request() req: any) {
    return this.enquiriesService.findByOwner(req.user.id);
  }
}
