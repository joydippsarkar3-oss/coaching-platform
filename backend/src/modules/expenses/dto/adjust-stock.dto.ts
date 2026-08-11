import { IsInt } from 'class-validator';

export class AdjustStockDto {
  /** Positive = restock, negative = consumption */
  @IsInt()
  delta: number;
}
