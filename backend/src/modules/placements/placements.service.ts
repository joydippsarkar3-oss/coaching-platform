import { Injectable } from '@nestjs/common';
import { JobFilterDto } from './dto/job.dto';

@Injectable()
export class PlacementsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getJobs(_centerId: string, _filter: JobFilterDto): Promise<never> {
    throw new Error('Placements module is a P2 feature — not yet implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async applyToJob(_jobId: string, _studentId: string): Promise<never> {
    throw new Error('Placements module is a P2 feature — not yet implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getApplications(_studentId: string): Promise<never> {
    throw new Error('Placements module is a P2 feature — not yet implemented');
  }
}
