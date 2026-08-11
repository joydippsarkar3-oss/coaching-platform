import { Module } from '@nestjs/common';
import { TypingController } from './typing.controller';
import { TypingService } from './typing.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TypingController],
  providers: [TypingService],
  exports: [TypingService],
})
export class TypingModule {}
