import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreateFeePlanDto {
  @ApiProperty({ example: 'Standard 3-Month Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1500000, description: 'Total fee in paise (₹15000 = 1500000)' })
  @IsInt()
  @IsPositive()
  totalAmountPaise: number;

  @ApiProperty({ example: 3, description: 'Number of installments' })
  @IsInt()
  @IsPositive()
  installmentCount: number;
}

export class CollectPaymentDto {
  @ApiProperty({ description: 'Installment ID to collect payment for' })
  @IsString()
  @IsNotEmpty()
  installmentId: string;

  @ApiProperty({ example: 500000, description: 'Amount in paise' })
  @IsInt()
  @IsPositive()
  amountPaise: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ required: false, description: 'External gateway transaction reference' })
  @IsOptional()
  @IsString()
  gatewayRef?: string;
}
