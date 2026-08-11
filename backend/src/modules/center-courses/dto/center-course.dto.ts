import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantCourseDto {
  @ApiProperty({ description: 'Course ID to grant to the center' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ required: false, description: 'Override fee in paise; if null uses course default' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  customFee?: number;
}

export class UpdateCenterCourseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  customFee?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
