import { IsString, IsNotEmpty, IsMobilePhone, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Mobile number with country code' })
  @IsMobilePhone()
  @IsNotEmpty()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsMobilePhone()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'P@ssword123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '123456', description: 'TOTP code (if 2FA enabled)', required: false })
  @IsString()
  @Length(6, 6)
  totpCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
