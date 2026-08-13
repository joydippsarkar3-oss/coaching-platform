import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExamStatus } from '@prisma/client';

export class CreateExamDto {
  @ApiProperty({ example: 'Tally Prime - Module 1 Assessment' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false, description: 'Course this exam belongs to' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsInt()
  @IsPositive()
  durationMin: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @IsPositive()
  totalMarks: number;

  @ApiProperty({ example: 40 })
  @IsInt()
  @IsPositive()
  passingMarks: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiProperty({ required: false, description: 'ISO start datetime' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiProperty({ required: false, description: 'ISO end datetime' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class UpdateExamDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  durationMin?: number;
}

export class StartAttemptDto {
  @ApiProperty({ description: 'Student ID taking the exam' })
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class BeginAttemptDto {
  @ApiProperty({ description: 'Student ID the attempt belongs to' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    required: false,
    description:
      'Raw client device fingerprint. The attempt binds to the first device that begins it; ' +
      'later writes from a different device are rejected.',
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class SubmitAttemptDto {
  @ApiProperty({
    description: 'Array of answers: [{questionId, selectedKey}]',
    type: 'array',
    items: { type: 'object', properties: { questionId: { type: 'string' }, selectedKey: { type: 'string' } } },
  })
  answers: Array<{ questionId: string; selectedKey: string }>;

  @ApiProperty({
    required: false,
    description: 'Raw client device fingerprint; must match the device the attempt is bound to.',
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}
