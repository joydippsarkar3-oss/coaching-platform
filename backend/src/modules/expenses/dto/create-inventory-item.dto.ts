import { IsString, IsInt, IsOptional, IsUrl, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsOptional()
  @IsString()
  centerId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantityOnHand?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unitCostPaise?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
