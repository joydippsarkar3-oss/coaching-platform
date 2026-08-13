import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
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

  @ApiProperty({
    required: false,
    description:
      'Meta-approved template name. Required for WHATSAPP when the 24-hour ' +
      'service window is closed — free-form text is rejected by the API there.',
  })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiProperty({ required: false, example: 'en', description: 'WhatsApp template language code' })
  @IsOptional()
  @IsString()
  templateLang?: string;

  @ApiProperty({
    required: false,
    description: 'WhatsApp template component objects (header/body/button parameters)',
    type: 'array',
    items: { type: 'object' },
  })
  @IsOptional()
  @IsArray()
  templateComponents?: object[];
}
