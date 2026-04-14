import { Testimonial } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const TESTIMONIAL_REPOSITORY = 'ITestimonialRepository';

export interface TestimonialFilter {
  search?: string;
  status?: string;
  projectId?: any;
}

export type ITestimonialRepository = IRepository<Testimonial>;
