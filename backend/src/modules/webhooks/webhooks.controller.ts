import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  Headers,
  Query,
  RawBodyRequest,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly svc: WebhooksService) {}

  // ─── Razorpay ─────────────────────────────────────────────────────────────

  @Post('razorpay')
  @HttpCode(200)
  async razorpay(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(req.body);
    return this.svc.handleRazorpay(rawBody, signature);
  }

  // ─── Cashfree ─────────────────────────────────────────────────────────────

  @Post('cashfree')
  @HttpCode(200)
  async cashfree(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-webhook-timestamp') timestamp: string,
    @Headers('x-webhook-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(req.body);
    return this.svc.handleCashfree(rawBody, timestamp, signature);
  }

  // ─── WhatsApp subscription verification (GET) ─────────────────────────────

  @Get('whatsapp')
  whatsappVerify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.svc.verifyWhatsAppChallenge(mode, token, challenge);
    res.status(200).send(result);
  }

  // ─── WhatsApp inbound messages (POST) ─────────────────────────────────────

  @Post('whatsapp')
  @HttpCode(200)
  whatsappInbound(@Req() req: Request) {
    return this.svc.handleWhatsApp(req.body);
  }

  // ─── Meta Leads ───────────────────────────────────────────────────────────

  @Get('meta-leads')
  metaLeadsVerify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.svc.verifyWhatsAppChallenge(mode, token, challenge);
    res.status(200).send(result);
  }

  @Post('meta-leads')
  @HttpCode(200)
  metaLeadsInbound(@Req() req: Request) {
    return this.svc.handleMetaLeads(req.body);
  }
}
