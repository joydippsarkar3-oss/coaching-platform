import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsPositive, IsUrl, IsJSON
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ example: 'CRS-TALLY-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Tally Prime Advanced' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 90, description: 'Course duration in days' })
  @IsInt()
  @IsPositive()
  durationDays: number;

  @ApiProperty({ example: 500000, description: 'Base fee in paise (₹5000 = 500000)' })
  @IsInt()
  @IsPositive()
  feePaise: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ required: false, description: 'JSON syllabus object' })
  @IsOptional()
  syllabus?: Record<string, unknown>;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiProperty({ required: false, enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
