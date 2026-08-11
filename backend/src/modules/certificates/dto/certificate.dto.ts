import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestCertificateDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Course ID' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ required: false, description: 'Certificate template ID' })
  @IsOptional()
  @IsString()
  templateId?: string;
}

export class IssueCertificateDto {
  @ApiProperty({ required: false, description: 'URL to the generated certificate PDF/image' })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}
