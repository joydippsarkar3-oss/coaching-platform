import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlacementsService } from './placements.service';
import { JobFilterDto } from './dto/job.dto';

@UseGuards(JwtAuthGuard)
@Controller('placements')
export class PlacementsController {
  constructor(private readonly svc: PlacementsService) {}

  @Get('jobs')
  getJobs(
    @Query('centerId') centerId: string,
    @Query() filter: JobFilterDto,
  ) {
    return this.svc.getJobs(centerId, filter);
  }

  @Post('jobs/:id/apply')
  applyToJob(
    @Param('id') jobId: string,
    @Body('studentId') studentId: string,
  ) {
    return this.svc.applyToJob(jobId, studentId);
  }

  @Get('my-applications')
  getApplications(@Query('studentId') studentId: string) {
    return this.svc.getApplications(studentId);
  }
}
