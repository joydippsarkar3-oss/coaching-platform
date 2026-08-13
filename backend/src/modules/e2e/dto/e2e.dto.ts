import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeedDto {
  @ApiProperty({ example: 'TEST01' })
  @IsString()
  @IsNotEmpty()
  centerCode: string;

  @ApiProperty({ example: '+919000000001' })
  @IsString()
  @IsNotEmpty()
  studentPhone: string;

  @ApiProperty({ example: '+919000000002' })
  @IsString()
  @IsNotEmpty()
  teacherPhone: string;

  @ApiProperty({ required: false, example: '+919000000003' })
  @IsOptional()
  @IsString()
  adminPhone?: string;
}

export class TeardownDto {
  @ApiProperty({ example: 'TEST01' })
  @IsString()
  @IsNotEmpty()
  centerCode: string;
}
