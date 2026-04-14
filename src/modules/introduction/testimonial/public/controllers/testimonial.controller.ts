import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicTestimonialService } from '@/modules/introduction/testimonial/public/services/testimonial.service';
import { Permission } from '@/common/auth/decorators';

@Controller('testimonials')
export class PublicTestimonialController {
  constructor(private readonly testimonialService: PublicTestimonialService) {}

  @Permission('public')
  @Get()
  findAll(@Query() query: any) {
    return this.testimonialService.getList(query);
  }

  @Permission('public')
  @Get('featured')
  getFeatured(@Query('limit') limit?: any) {
    return this.testimonialService.getFeatured(limit ? Number(limit) : 10);
  }

  @Permission('public')
  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.testimonialService.findByProject(Number(projectId));
  }

  @Permission('public')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testimonialService.getOne(id);
  }
}
