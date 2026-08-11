import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TicketStatus, TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @IsOptional()
  @IsString()
  centerId?: string;

  @IsOptional()
  @IsString()
  raisedBy?: string;

  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
