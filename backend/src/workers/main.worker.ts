import { NestFactory } from '@nestjs/core';
import { WorkersModule } from './workers.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkersModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  app.enableShutdownHooks();
}

bootstrap().catch((err) => {
  console.error('Worker failed to start', err);
  process.exit(1);
});
