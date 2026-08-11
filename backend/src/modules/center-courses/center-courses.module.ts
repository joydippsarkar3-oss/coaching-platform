import { Module } from '@nestjs/common';
import { CenterCoursesController } from './center-courses.controller';
import { CenterCoursesService } from './center-courses.service';

@Module({
  controllers: [CenterCoursesController],
  providers: [CenterCoursesService],
  exports: [CenterCoursesService],
})
export class CenterCoursesModule {}
