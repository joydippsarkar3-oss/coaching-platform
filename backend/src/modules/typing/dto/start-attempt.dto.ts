import {
  IsOptional,
  IsUUID,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartAttemptDto {
  @ApiProperty({ required: false, description: 'Optional TypingTest ID' })
  @IsOptional()
  @IsUUID()
  testId?: string;

  @ApiProperty({ required: false, description: 'Optional specific passage ID; random otherwise' })
  @IsOptional()
  @IsUUID()
  passageId?: string;

  @ApiProperty({ example: 'en', enum: ['en', 'hi'] })
  @IsIn(['en', 'hi'])
  language: string;

  @ApiProperty({
    example: 'qwerty',
    enum: ['qwerty', 'remington_gail', 'inscript', 'krutidev010'],
  })
  @IsIn(['qwerty', 'remington_gail', 'inscript', 'krutidev010'])
  layout: string;

  @ApiProperty({
    required: false,
    enum: ['cpct_en', 'cpct_hi', 'ssc_chsl', 'ssc_cgl', 'dest', 'custom'],
  })
  @IsOptional()
  @IsIn(['cpct_en', 'cpct_hi', 'ssc_chsl', 'ssc_cgl', 'dest', 'custom'])
  preset?: string;

  @ApiProperty({ example: 900, description: 'Duration in seconds (60–3600)' })
  @IsInt()
  @Min(60)
  @Max(3600)
  durationSeconds: number;
}
