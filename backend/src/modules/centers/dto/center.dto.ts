import {
  IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, Length, Matches
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CenterStatus } from '@prisma/client';

export class CreateCenterDto {
  @ApiProperty({ example: 'CTR001' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  code: string;

  @ApiProperty({ example: 'Sunrise Computer Institute' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Ramesh Kumar' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: 'center@sunrise.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  phone: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @Length(6, 6)
  pincode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  territoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateCenterDto extends PartialType(CreateCenterDto) {
  @ApiProperty({ required: false, enum: CenterStatus })
  @IsOptional()
  @IsEnum(CenterStatus)
  status?: CenterStatus;
}
