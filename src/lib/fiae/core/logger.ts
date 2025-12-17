/**
 * FIAE Logger Service
 * Winston-based logging with audit trail
 */

import winston from 'winston';
import { AuditLogEntry, AuditEventType } from '@/types/fiae';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'fiae' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

export class AuditLogger {
  private entries: AuditLogEntry[] = [];

  addEntry(
    eventType: AuditEventType,
    description: string,
    details: Record<string, unknown>,
    errorMessage?: string
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      eventType,
      description,
      details,
      errorMessage,
    };

    this.entries.push(entry);
    
    if (errorMessage) {
      logger.error(description, { eventType, details, errorMessage });
    } else {
      logger.info(description, { eventType, details });
    }
  }

  getEntries(): AuditLogEntry[] {
    return this.entries;
  }

  toJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }
}

export function createAuditLogger(): AuditLogger {
  return new AuditLogger();
}
