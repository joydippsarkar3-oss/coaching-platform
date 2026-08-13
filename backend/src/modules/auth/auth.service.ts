import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestOtpDto, VerifyOtpDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new BadRequestException('No account found for this phone number');
    }

    // Expire existing OTPs
    await this.prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await this.prisma.otpCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    // Stub SMS provider
    await this.sendSms(dto.phone, `Your OTP is ${code}. Valid for 5 minutes.`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { roleAssignments: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: dto.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return this.generateTokenPair(user);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    if (!dto.email) throw new BadRequestException('Email is required');

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roleAssignments: true },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.totpSecret) {
      if (!dto.totpCode) {
        throw new UnauthorizedException('TOTP code required');
      }
      const isValid = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: dto.totpCode,
        window: 1,
      });
      if (!isValid) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return this.generateTokenPair(user);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; centerId?: string; type: string };

    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('app.jwtRefreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Not a refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roleAssignments: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateTokenPair(user);
  }

  private generateTokenPair(user: any): { accessToken: string; refreshToken: string } {
    const roles = user.roleAssignments?.map((r: any) => r.role) ?? [];
    const centerId = user.centerId ?? user.roleAssignments?.[0]?.centerId ?? null;

    const jwtPayload = { sub: user.id, centerId, roles, type: 'access' };
    const refreshPayload = { sub: user.id, centerId, type: 'refresh' };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('app.jwtSecret'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('app.jwtRefreshSecret'),
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    // Stub — replace with actual SMS provider implementation
    console.log(`[SMS] To: ${phone} | Message: ${message}`);
  }
}
