import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  enrollmentId: string;

  @IsUUID()
  installmentId: string;

  @IsInt()
  @Min(1)
  amount: number; // paise
}
