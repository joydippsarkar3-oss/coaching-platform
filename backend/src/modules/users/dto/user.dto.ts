import {
  IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsBoolean, Matches
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'priya@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  centerId?: string;

  @ApiProperty({ enum: Role, isArray: true, required: false })
  @IsOptional()
  @IsEnum(Role, { each: true })
  roles?: Role[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  centerId?: string;
}
