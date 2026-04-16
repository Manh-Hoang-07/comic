import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/modules/system/auth/services/auth.service';
import { USER_REPOSITORY } from '@/modules/system/user/domain/user.repository';
import { RegistrationService } from '@/modules/system/auth/services/registration.service';
import { PasswordService } from '@/modules/system/auth/services/password.service';
import { AuthOtpService } from '@/modules/system/auth/services/auth-otp.service';
import { SocialAuthService } from '@/modules/system/auth/services/social-auth.service';
import { LoginService } from '@/modules/system/auth/services/login.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let loginService: any;
  let registrationService: any;
  let passwordService: any;
  let otpService: any;
  let socialAuthService: any;

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    loginService = {
      login: jest.fn(),
      logout: jest.fn(),
      refreshTokenByValue: jest.fn(),
    };

    registrationService = { register: jest.fn() };
    passwordService = { forgotPassword: jest.fn(), resetPassword: jest.fn() };
    otpService = {
      sendRegisterOtp: jest.fn(),
      sendForgotPasswordOtp: jest.fn(),
    };
    socialAuthService = { handleGoogleAuth: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: LoginService, useValue: loginService },
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
    const dto = { email: 'test@test.com', password: 'password123' };

    it('delegates to LoginService', async () => {
      loginService.login.mockResolvedValue({
        token: 't',
        refreshToken: 'r',
        expiresIn: 3600,
      });

      const result = await service.login(dto as any);

      expect(loginService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        token: 't',
        refreshToken: 'r',
        expiresIn: 3600,
      });
    });
  });

  describe('logout', () => {
    it('delegates to LoginService', async () => {
      loginService.logout.mockResolvedValue(undefined);

      await service.logout(1, 'tok');

      expect(loginService.logout).toHaveBeenCalledWith(1, 'tok');
    });
  });

  describe('refreshTokenByValue', () => {
    it('delegates to LoginService', async () => {
      loginService.refreshTokenByValue.mockResolvedValue({
        token: 'a',
        refreshToken: 'b',
        expiresIn: 60,
      });

      const result = await service.refreshTokenByValue('rt');

      expect(loginService.refreshTokenByValue).toHaveBeenCalledWith('rt');
      expect(result).toEqual({ token: 'a', refreshToken: 'b', expiresIn: 60 });
    });
  });

  describe('register', () => {
    it('delegates to registration service', async () => {
      const dto: any = { email: 'test@test.com' };
      registrationService.register.mockResolvedValue('registered');
      const result = await service.register(dto);
      expect(registrationService.register).toHaveBeenCalledWith(dto);
      expect(result).toBe('registered');
    });
  });

  describe('sendOtpForRegister', () => {
    it('throws when email exists', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 1 });
      await expect(
        service.sendOtpForRegister({ email: 'a@b.com' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(otpService.sendRegisterOtp).not.toHaveBeenCalled();
    });

    it('sends OTP when email is free', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      otpService.sendRegisterOtp.mockResolvedValue(undefined);

      const result = await service.sendOtpForRegister({
        email: 'new@test.com',
      } as any);

      expect(otpService.sendRegisterOtp).toHaveBeenCalledWith('new@test.com');
      expect(result.message).toContain('OTP');
    });
  });

  describe('sendOtpForForgotPassword', () => {
    it('throws when email missing', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      await expect(
        service.sendOtpForForgotPassword({ email: 'x@y.com' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sends OTP when email exists', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 1 });
      otpService.sendForgotPasswordOtp.mockResolvedValue(undefined);

      await service.sendOtpForForgotPassword({ email: 'a@b.com' } as any);

      expect(otpService.sendForgotPasswordOtp).toHaveBeenCalledWith('a@b.com');
    });
  });

  describe('me', () => {
    it('throws if user not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.me(1)).rejects.toThrow('Không tìm thấy người dùng');
    });

    it('returns safe user object', async () => {
      userRepo.findById.mockResolvedValue({ id: 1, password: 'sec' });
      const result = await service.me(1);
      expect(result.id).toBe(1);
      expect((result as any).password).toBeUndefined();
    });
  });

  describe('handleGoogleAuth', () => {
    it('delegates to socialAuthService', async () => {
      const profile = { googleId: '123' };
      socialAuthService.handleGoogleAuth.mockResolvedValue('googleResult');
      const result = await service.handleGoogleAuth(profile);
      expect(socialAuthService.handleGoogleAuth).toHaveBeenCalledWith(profile);
      expect(result).toBe('googleResult');
    });
  });
});
