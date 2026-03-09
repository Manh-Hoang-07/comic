import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/modules/core/auth/services/auth.service';
import { USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { RedisUtil } from '@/core/utils/redis.util';
import { TokenBlacklistService } from '@/core/security/token-blacklist.service';
import { TokenService } from '@/modules/core/auth/services/token.service';
import { AttemptLimiterService } from '@/core/security/attempt-limiter.service';
import { MailService } from '@/core/mail/mail.service';
import { ContentTemplateExecutionService } from '@/modules/core/content-template/services/content-template-execution.service';
import { RegistrationService } from '@/modules/core/auth/services/registration.service';
import { PasswordService } from '@/modules/core/auth/services/password.service';
import { AuthOtpService } from '@/modules/core/auth/services/auth-otp.service';
import { SocialAuthService } from '@/modules/core/auth/services/social-auth.service';
import { UserStatus } from '@/shared/enums/types/user-status.enum';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;
    let userRepo: any;
    let redisUtil: any;
    let tokenBlacklist: any;
    let tokenService: any;
    let lockoutService: any;
    let mailService: any;
    let contentTemplateService: any;
    let notificationQueue: any;
    let registrationService: any;
    let passwordService: any;
    let otpService: any;
    let socialAuthService: any;

    beforeEach(async () => {
        userRepo = {
            findByEmailForAuth: jest.fn(),
            updateLastLogin: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findByPhone: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
        };

        redisUtil = {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
        };

        tokenBlacklist = {
            add: jest.fn(),
        };

        tokenService = {
            generateTokens: jest.fn(),
            getRefreshTtlSec: jest.fn(),
            getAccessTtlSec: jest.fn(),
            decodeRefresh: jest.fn(),
            issueAndStoreNewTokens: jest.fn(),
        };

        lockoutService = {
            check: jest.fn(),
            add: jest.fn(),
            reset: jest.fn(),
        };

        mailService = {
            send: jest.fn(),
        };

        contentTemplateService = {
            execute: jest.fn(),
        };

        notificationQueue = {
            add: jest.fn().mockResolvedValue({}),
        };

        registrationService = { register: jest.fn() };
        passwordService = { forgotPassword: jest.fn(), resetPassword: jest.fn() };
        otpService = { sendRegisterOtp: jest.fn(), sendForgotPasswordOtp: jest.fn() };
        socialAuthService = { handleGoogleAuth: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: USER_REPOSITORY, useValue: userRepo },
                { provide: RedisUtil, useValue: redisUtil },
                { provide: TokenBlacklistService, useValue: tokenBlacklist },
                { provide: TokenService, useValue: tokenService },
                { provide: AttemptLimiterService, useValue: lockoutService },
                { provide: MailService, useValue: mailService },
                { provide: ContentTemplateExecutionService, useValue: contentTemplateService },
                { provide: 'BullQueue_notification', useValue: notificationQueue }, // MOCK InjectQueue('notification')
                { provide: RegistrationService, useValue: registrationService },
                { provide: PasswordService, useValue: passwordService },
                { provide: AuthOtpService, useValue: otpService },
                { provide: SocialAuthService, useValue: socialAuthService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        const dto = { email: 'test@TEST.com', password: 'password123' };
        const normalizedEmail = 'test@test.com';

        it('should throw error if account is locked out', async () => {
            lockoutService.check.mockResolvedValue({ isLocked: true, remainingMinutes: 5 });

            await expect(service.login(dto)).rejects.toThrow('Tài khoản đã bị khóa tạm thời do quá nhiều lần đăng nhập sai');
        });

        it('should throw error if user not found', async () => {
            lockoutService.check.mockResolvedValue({ isLocked: false, remainingMinutes: 0 });
            userRepo.findByEmailForAuth.mockResolvedValue(null);

            await expect(service.login(dto)).rejects.toThrow('Email hoặc mật khẩu không đúng.');
            expect(userRepo.findByEmailForAuth).toHaveBeenCalledWith(normalizedEmail);
            expect(lockoutService.add).toHaveBeenCalledWith('auth:login', normalizedEmail);
        });

        it('should throw error if password mismatch', async () => {
            lockoutService.check.mockResolvedValue({ isLocked: false, remainingMinutes: 0 });
            userRepo.findByEmailForAuth.mockResolvedValue({ id: 1, email: normalizedEmail, password: 'hashed' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(dto)).rejects.toThrow('Email hoặc mật khẩu không đúng.');
            expect(lockoutService.add).toHaveBeenCalledWith('auth:login', normalizedEmail);
        });

        it('should throw error if account inactive', async () => {
            lockoutService.check.mockResolvedValue({ isLocked: false, remainingMinutes: 0 });
            userRepo.findByEmailForAuth.mockResolvedValue({ id: 1, email: normalizedEmail, password: 'hashed', status: UserStatus.inactive });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.login(dto)).rejects.toThrow('Tài khoản đã bị khóa hoặc không hoạt động.');
        });

        it('should login successfully and return tokens', async () => {
            lockoutService.check.mockResolvedValue({ isLocked: false, remainingMinutes: 0 });
            userRepo.findByEmailForAuth.mockResolvedValue({ id: 1, email: normalizedEmail, password: 'hashed', status: UserStatus.active });
            userRepo.updateLastLogin.mockResolvedValue({});
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            tokenService.generateTokens.mockReturnValue({
                accessToken: 'acc', refreshToken: 'ref', refreshJti: 'jti', accessTtlSec: 3600
            });
            tokenService.getRefreshTtlSec.mockReturnValue(86400);
            redisUtil.set.mockResolvedValue({});

            const result = await service.login(dto);

            expect(result).toEqual({ token: 'acc', refreshToken: 'ref', expiresIn: 3600 });
            expect(lockoutService.reset).toHaveBeenCalledWith('auth:login', normalizedEmail);
            expect(userRepo.updateLastLogin).toHaveBeenCalledWith(1);
            expect(redisUtil.set).toHaveBeenCalledWith('auth:refresh:1:jti', '1', 86400);
        });
    });

    describe('register', () => {
        it('should delegate to registration service', async () => {
            const dto: any = { email: 'test@test.com' };
            registrationService.register.mockResolvedValue('registered');
            const result = await service.register(dto);
            expect(registrationService.register).toHaveBeenCalledWith(dto);
            expect(result).toBe('registered');
        });
    });

    describe('logout', () => {


        it('should blacklist token if provided', async () => {
            userRepo.findById.mockResolvedValue({ id: 1 });
            tokenService.getAccessTtlSec.mockReturnValue(3600);

            await service.logout(1, 'token-value');

            expect(tokenBlacklist.add).toHaveBeenCalledWith('token-value', 3600);
        });
    });

    describe('refreshTokenByValue', () => {
        it('should throw if token is invalid or cannot be decoded', async () => {
            tokenService.decodeRefresh.mockReturnValue(null);
            await expect(service.refreshTokenByValue('invalid')).rejects.toThrow('Invalid or expired token');
        });

        it('should throw if token payload is invalid (missing sub or jti)', async () => {
            tokenService.decodeRefresh.mockReturnValue({ sub: null, jti: null });
            await expect(service.refreshTokenByValue('valid')).rejects.toThrow('Invalid refresh token');
        });

        it('should throw if refresh token is revoked/expired in redis', async () => {
            tokenService.decodeRefresh.mockReturnValue({ sub: 1, jti: 'abc' });
            redisUtil.get.mockResolvedValue(null); // Return false
            await expect(service.refreshTokenByValue('valid')).rejects.toThrow('Refresh token revoked or expired');
        });

        it('should issue new tokens if valid active refresh token', async () => {
            tokenService.decodeRefresh.mockReturnValue({ sub: 1, jti: 'abc', email: 'e' });
            redisUtil.get.mockResolvedValue('1'); // Return true
            tokenService.issueAndStoreNewTokens.mockResolvedValue({
                accessToken: 'acc', refreshToken: 'ref', accessTtlSec: 3600
            });

            const result = await service.refreshTokenByValue('valid');

            expect(redisUtil.del).toHaveBeenCalledWith('auth:refresh:1:abc');
            expect(tokenService.issueAndStoreNewTokens).toHaveBeenCalledWith(1, 'e');
            expect(result).toEqual({ token: 'acc', refreshToken: 'ref', expiresIn: 3600 });
        });
    });

    describe('me', () => {
        it('should throw if user not found', async () => {
            userRepo.findById.mockResolvedValue(null);
            await expect(service.me(1)).rejects.toThrow('Không tìm thấy người dùng');
        });

        it('should return safe user object', async () => {
            userRepo.findById.mockResolvedValue({ id: 1, password: 'sec' });
            const result = await service.me(1);
            expect(result.id).toBe(1);
            expect((result as any).password).toBeUndefined();
        });
    });

    describe('handleGoogleAuth', () => {
        it('should delegate to socialAuthService', async () => {
            const profile = { googleId: '123' };
            socialAuthService.handleGoogleAuth.mockResolvedValue('googleResult');
            const result = await service.handleGoogleAuth(profile);
            expect(socialAuthService.handleGoogleAuth).toHaveBeenCalledWith(profile);
            expect(result).toBe('googleResult');
        });
    });
});




