import { DynamicModule, Module } from '@nestjs/common';
import { E2eController } from './e2e.controller';
import { E2eService } from './e2e.service';

/**
 * Registered via E2eModule.register() so the controller is not even mounted
 * unless fixtures are explicitly enabled. Returns an empty module otherwise.
 */
@Module({})
export class E2eModule {
  static register(): DynamicModule {
    if (!E2eService.isEnabled()) {
      return { module: E2eModule };
    }
    return {
      module: E2eModule,
      controllers: [E2eController],
      providers: [E2eService],
    };
  }
}
