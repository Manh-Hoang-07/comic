import { Module } from '@nestjs/common';
import { ProjectModule } from './project/project.module';
import { AboutModule } from './about/about.module';
import { StaffModule } from './staff/staff.module';
import { TestimonialModule } from './testimonial/testimonial.module';
import { PartnerModule } from './partner/partner.module';
import { GalleryModule } from './gallery/gallery.module';
import { CertificateModule } from './certificate/certificate.module';
import { FaqModule } from './faq/faq.module';

@Module({
    imports: [
        ProjectModule,
        AboutModule,
        StaffModule,
        TestimonialModule,
        PartnerModule,
        GalleryModule,
        CertificateModule,
        FaqModule,
    ],
    exports: [
        ProjectModule,
        AboutModule,
        StaffModule,
        TestimonialModule,
        PartnerModule,
        GalleryModule,
        CertificateModule,
        FaqModule,
    ],
})
export class IntroductionModule { }
