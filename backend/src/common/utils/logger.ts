import { Injectable, LoggerService, Scope } from '@nestjs/common';

export interface LogMeta {
  centerId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

/** Structured JSON logger — wraps NestJS LoggerService. */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger implements LoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
    return this;
  }

  private emit(level: string, message: string, meta?: LogMeta) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      context: this.context,
      msg: message,
      ...meta,
    };
    // In production swap for pino/winston transport
    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  log(message: string, meta?: LogMeta)   { this.emit('info',  message, meta); }
  error(message: string, meta?: LogMeta) { this.emit('error', message, meta); }
  warn(message: string, meta?: LogMeta)  { this.emit('warn',  message, meta); }
  debug(message: string, meta?: LogMeta) { this.emit('debug', message, meta); }
  verbose(message: string, meta?: LogMeta) { this.emit('trace', message, meta); }
}
