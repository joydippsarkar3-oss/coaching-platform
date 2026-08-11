import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '30d',
  smsProviderKey: process.env.SMS_PROVIDER_KEY,
  wabaToken: process.env.WABA_TOKEN,
  s3Bucket: process.env.S3_BUCKET,
  awsRegion: process.env.AWS_REGION,
  paymentGatewayKey: process.env.PAYMENT_GATEWAY_KEY,
  sentryDsn: process.env.SENTRY_DSN,
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? '*',
}));

export const appConfigSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  SMS_PROVIDER_KEY: Joi.string().required(),
  WABA_TOKEN: Joi.string().optional().allow(''),
  S3_BUCKET: Joi.string().optional().allow(''),
  AWS_REGION: Joi.string().optional().allow(''),
  PAYMENT_GATEWAY_KEY: Joi.string().optional().allow(''),
  SENTRY_DSN: Joi.string().optional().allow(''),
  ALLOWED_ORIGINS: Joi.string().optional().default('*'),
});
