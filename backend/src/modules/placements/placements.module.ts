import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PlacementsController } from './placements.controller';
import { PlacementsService } from './placements.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlacementsController],
  providers: [PlacementsService],
  exports: [PlacementsService],
})
export class PlacementsModule {}
