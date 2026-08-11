import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KeystrokeEventDto {
  @ApiProperty({ example: 'a', description: 'The key pressed' })
  @IsString()
  key: string;

  @ApiProperty({ example: 1691000000000, description: 'Unix ms timestamp' })
  @IsInt()
  timestamp: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isBackspace: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;
}

export class SubmitAttemptDto {
  @ApiProperty({ description: 'Full typed string at submission time' })
  @IsString()
  typed: string;

  @ApiProperty({
    type: [KeystrokeEventDto],
    description: 'Ordered keystroke log captured by the client widget',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeystrokeEventDto)
  keystrokeLog: KeystrokeEventDto[];
}
