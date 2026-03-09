import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { UserStatus } from '@/shared/enums/types/user-status.enum';
import { RegisterDto } from '../dto/register.dto';
import { AuthOtpService } from './auth-otp.service';
import { safeUser } from '../utils/user.util';

@Injectable()
export class RegistrationService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepo: IUserRepository,
        private readonly otpService: AuthOtpService,
        @InjectQueue('notification')
        private readonly notificationQueue: Queue,
    ) { }

    /**
     * Register a new user with OTP verification.
     */
    async register(dto: RegisterDto) {
        const email = dto.email.toLowerCase();

        // 1. Verify OTP
        const isOtpValid = await this.otpService.verifyAndDelete('register', email, dto.otp);
        if (!isOtpValid) {
            throw new BadRequestException('Mã OTP không chính xác hoặc đã hết hạn.');
        }

        // 2. Uniqueness Checks
        await this.validateUniqueness(dto);

        // 3. Create User
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.userRepo.create({
            username: dto.username ?? email,
            email: email,
            phone: dto.phone ?? null,
            password: hashedPassword,
            name: dto.name,
            status: UserStatus.active as any,
        });

        // 4. Queue Welcome Email
        this.queueWelcomeEmail(user);

        return { user: safeUser(user) };
    }

    private async validateUniqueness(dto: RegisterDto): Promise<void> {
        const email = dto.email.toLowerCase();

        if (await this.userRepo.findByEmail(email)) {
            throw new BadRequestException('Email đã được sử dụng.');
        }

        if (dto.username && (await this.userRepo.findByUsername(dto.username))) {
            throw new BadRequestException('Tên đăng nhập đã được sử dụng.');
        }

        if (dto.phone && (await this.userRepo.findByPhone(dto.phone))) {
            throw new BadRequestException('Số điện thoại đã được sử dụng.');
        }
    }

    private queueWelcomeEmail(user: any): void {
        this.notificationQueue.add(
            'send_email_template',
            {
                templateCode: 'registration_success',
                options: {
                    to: user.email!,
                    variables: {
                        name: user.name || user.username,
                        username: user.username,
                        email: user.email,
                        loginUrl: `${process.env.APP_URL}/auth/login`,
                    },
                },
            },
            {
                jobId: `register-success-${user.id}`,
                attempts: 3,
                backoff: 5000,
                removeOnComplete: true,
            },
        ).catch((err) => console.error('Failed to queue registration success email', err));
    }
}
