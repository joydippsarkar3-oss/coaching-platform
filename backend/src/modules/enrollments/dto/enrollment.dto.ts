import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Course ID' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ required: false, description: 'Batch ID to assign the student to' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({ required: false, description: 'Fee plan ID to apply' })
  @IsOptional()
  @IsString()
  feePlanId?: string;
}
