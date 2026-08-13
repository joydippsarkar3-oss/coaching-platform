import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestCertificateDto {
  @ApiProperty({ description: 'Enrollment ID the certificate is requested for' })
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ required: false, description: 'Certificate template ID' })
  @IsOptional()
  @IsString()
  templateId?: string;
}

export class RevokeCertificateDto {
  @ApiProperty({ description: 'Reason for revocation (retained in audit trail)' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class IssueCertificateDto {
  @ApiProperty({ required: false, description: 'URL to the generated certificate PDF/image' })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}
