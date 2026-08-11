import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  employerId: string;

  @IsString()
  centerId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMinPaise?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMaxPaise?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  openings?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class JobFilterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
