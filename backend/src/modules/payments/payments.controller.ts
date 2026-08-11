import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/v1/payments/orders
   * Creates a gateway checkout order for the specified installment.
   * Returns the gateway order payload so the client can open the payment UI.
   */
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a checkout order for an installment payment' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: { centerId?: string },
  ) {
    return this.paymentsService.createCheckoutOrder(
      dto.enrollmentId,
      dto.installmentId,
      dto.amount,
      user.centerId ?? '',
    );
  }

  /**
   * POST /api/v1/payments/webhook/razorpay
   * Public endpoint — Razorpay posts signed events here.
   * Raw body is required for signature verification; NestJS raw body
   * must be enabled in main.ts via rawBody: true on NestFactory.create.
   */
  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay webhook receiver (public)' })
  async razorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from('');
    await this.paymentsService.handleWebhook(rawBody, signature ?? '', 'razorpay');
    return { received: true };
  }

  /**
   * POST /api/v1/payments/webhook/cashfree
   * Public endpoint — Cashfree posts signed events here.
   * Signature format: "<timestamp>.<base64_sig>" in x-webhook-signature header.
   */
  @Post('webhook/cashfree')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cashfree webhook receiver (public)' })
  async cashfreeWebhook(
    @Req() req: Request,
    @Headers('x-webhook-signature') signature: string,
  ) {
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from('');
    await this.paymentsService.handleWebhook(rawBody, signature ?? '', 'cashfree');
    return { received: true };
  }
}
