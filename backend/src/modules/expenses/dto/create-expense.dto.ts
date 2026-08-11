import { IsString, IsInt, IsOptional, IsUrl, IsDateString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsOptional()
  @IsString()
  centerId?: string;

  @IsString()
  category: string;

  @IsInt()
  @Min(1)
  amountPaise: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  recordedBy?: string;

  @IsDateString()
  expensedAt: string;
}
