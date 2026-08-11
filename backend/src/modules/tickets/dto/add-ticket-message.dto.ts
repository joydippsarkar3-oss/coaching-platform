import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class AddTicketMessageDto {
  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsBoolean()
  isStaff?: boolean;
}
