import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Patch,
  ValidationPipe,
} from '@nestjs/common';
import { TestimonialService } from '@/modules/introduction/testimonial/admin/services/testimonial.service';
import { CreateTestimonialDto } from '@/modules/introduction/testimonial/admin/dtos/create-testimonial.dto';
import { UpdateTestimonialDto } from '@/modules/introduction/testimonial/admin/dtos/update-testimonial.dto';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';
@Controller('admin/testimonials')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @LogRequest()
  @Post()
  @Permission('testimonial.manage')
  create(@Body(ValidationPipe) createTestimonialDto: CreateTestimonialDto) {
    return this.testimonialService.create(createTestimonialDto);
  }

  @Get()
  @Permission('testimonial.manage')
  findAll(@Query(ValidationPipe) query: any) {
    return this.testimonialService.getList(query);
  }

  @Get('simple')
  @Permission('testimonial.manage')
  getSimpleList(@Query(ValidationPipe) query: any) {
    return this.testimonialService.getSimpleList(query);
  }

  @Get(':id')
  @Permission('testimonial.manage')
  findOne(@Param('id') id: string) {
    return this.testimonialService.getOne(id);
  }

  @Put(':id')
  @Permission('testimonial.manage')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTestimonialDto: UpdateTestimonialDto,
  ) {
    return this.testimonialService.update(id, updateTestimonialDto);
  }

  @Delete(':id')
  @Permission('testimonial.manage')
  remove(@Param('id') id: string) {
    return this.testimonialService.delete(id);
  }

  @Patch(':id/featured')
  @Permission('testimonial.manage')
  toggleFeatured(@Param('id') id: string, @Body('featured') featured: boolean) {
    return this.testimonialService.toggleFeatured(id, featured);
  }
}
