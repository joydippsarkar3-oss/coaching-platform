import {
  IsString, IsNotEmpty, IsEmail, IsOptional, IsDateString,
  IsMobilePhone, IsBoolean, IsUrl
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'Anjali Verma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+919876543210' })
  @IsMobilePhone()
  phone: string;

  @ApiProperty({ required: false, example: 'anjali@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '2000-05-15' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({ required: false, example: 'F' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMobilePhone()
  guardianPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  centerId?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateConsentDto {
  @ApiProperty({ example: 'DATA_SHARING' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  granted: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
