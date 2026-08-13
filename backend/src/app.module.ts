import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { appConfig, appConfigSchema } from './common/config/app.config';
import { PrismaModule } from './common/prisma/prisma.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { CentersModule } from './modules/centers/centers.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CenterCoursesModule } from './modules/center-courses/center-courses.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { FeesModule } from './modules/fees/fees.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ExamsModule } from './modules/exams/exams.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { WorkersModule } from './workers/workers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ConsentModule } from './modules/consent/consent.module';
import { TypingModule } from './modules/typing/typing.module';
import { ContentItemsModule } from './modules/content-items/content-items.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CrmModule } from './modules/crm/crm.module';
import { PlacementsModule } from './modules/placements/placements.module';
import { E2eModule } from './modules/e2e/e2e.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: appConfigSchema,
      validationOptions: { abortEarly: true },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 500,
      },
    ]),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    CentersModule,
    UsersModule,
    StudentsModule,
    CoursesModule,
    CenterCoursesModule,
    EnquiriesModule,
    EnrollmentsModule,
    FeesModule,
    CertificatesModule,
    ExamsModule,
    NotificationsModule,
    AuditModule,
    WorkersModule,
    PaymentsModule,
    ConsentModule,
    TypingModule,
    ContentItemsModule,
    ExpensesModule,
    TicketsModule,
    WebhooksModule,
    PlacementsModule,
    AnalyticsModule,
    CrmModule,
    HealthModule,
    // No-op unless E2E_FIXTURES_ENABLED=true and NODE_ENV !== production.
    E2eModule.register(),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
