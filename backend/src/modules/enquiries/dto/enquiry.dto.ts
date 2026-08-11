import {
  IsString, IsNotEmpty, IsEmail, IsOptional, IsMobilePhone
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateEnquiryDto {
  @ApiProperty({ example: 'Rohit Mehta' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsMobilePhone()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Course the enquiry is about' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ required: false, example: 'WALK_IN' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'User ID of assigned staff' })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class UpdateEnquiryDto extends PartialType(CreateEnquiryDto) {}

export class CreateFollowUpDto {
  @ApiProperty({ example: 'Called the student, interested in Tally course' })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiProperty({ required: false, description: 'ISO date of next follow-up' })
  @IsOptional()
  @IsString()
  nextFollowUpAt?: string;
}
