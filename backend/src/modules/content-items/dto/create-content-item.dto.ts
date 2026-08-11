import { IsString, IsEnum, IsOptional, IsInt, IsUrl, Min } from 'class-validator';
import { ContentType } from '@prisma/client';

export class CreateContentItemDto {
  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  centerId?: string;

  @IsString()
  title: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;
}
