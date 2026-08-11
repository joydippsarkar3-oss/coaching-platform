import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel } from '@prisma/client';

export class SendNotificationDto {
  @ApiProperty({ required: false, description: 'User ID (if sending to a registered user)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: 'Message template ID' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ enum: NotificationChannel, example: 'SMS' })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ example: '+919876543210 or email address or device token' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({ required: false, description: 'Email subject (required for EMAIL channel)' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'Your OTP is 123456' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
