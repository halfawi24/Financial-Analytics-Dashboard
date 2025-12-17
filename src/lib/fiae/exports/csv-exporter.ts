/**
 * FIAE CSV Exporter
 * Generates clean CSV exports for all data
 */

import { NormalizedFinancialModel, Transaction, TimeBucket } from '@/types/fiae';
import * as fs from 'fs';
import { AuditLogger } from '@/lib/fiae/core/logger';

export class CSVExporter {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  async export(model: NormalizedFinancialModel, outputPath: string): Promise<string> {
    try {
      // Export all data to a single CSV file
      const headers = ['Type', 'Period/ID', 'Value'];
      const rows: string[][] = [];

      // Add metrics
      Object.entries(model.calculatedMetrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          rows.push(['Metric', key, value.toString()]);
        }
      });

      // Add transaction summary
      rows.push(['Transactions', 'Count', model.transactions.length.toString()]);

      // Add time bucket summary
      rows.push(['Time Buckets', 'Count', model.timeBuckets.length.toString()]);

      const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      const { writeFile } = await import('fs/promises');
      await writeFile(outputPath, csv);

      this.auditLogger.addEntry('export_generated', `CSV export created: ${outputPath}`, { outputPath });
      return outputPath;
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'CSV export failed',
        { outputPath },
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  exportTransactions(transactions: Transaction[], outputPath: string): string {
    try {
      const headers = ['id', 'date', 'entity', 'amount', 'direction', 'category', 'description', 'reference', 'status'];
      const rows = transactions.map(t => [
        t.id,
        t.date.toISOString().split('T')[0],
        t.entity,
        t.amount.toString(),
        t.direction,
        t.category,
        t.description,
        t.reference,
        t.status,
      ]);

      const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      fs.writeFileSync(outputPath, csv);

      this.auditLogger.addEntry('export_generated', `CSV export created: ${outputPath}`, { outputPath });
      return outputPath;
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'CSV export failed',
        { outputPath },
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  exportTimeBuckets(timeBuckets: TimeBucket[], outputPath: string): string {
    try {
      const headers = ['period', 'startDate', 'endDate', 'inflows', 'outflows', 'netCash', 'transactionCount'];
      const rows = timeBuckets.map(tb => [
        tb.period,
        tb.startDate.toISOString().split('T')[0],
        tb.endDate.toISOString().split('T')[0],
        tb.inflows.toString(),
        tb.outflows.toString(),
        tb.netCash.toString(),
        tb.transactions.length.toString(),
      ]);

      const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      fs.writeFileSync(outputPath, csv);

      this.auditLogger.addEntry('export_generated', `CSV export created: ${outputPath}`, { outputPath });
      return outputPath;
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'CSV export failed',
        { outputPath },
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  exportMetrics(model: NormalizedFinancialModel, outputPath: string): string {
    try {
      const metrics = model.calculatedMetrics;
      const rows = Object.entries(metrics)
        .filter(([, v]) => typeof v === 'number')
        .map(([k, v]) => [k, v.toString()]);

      const csv = [['Metric', 'Value'], ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      fs.writeFileSync(outputPath, csv);

      this.auditLogger.addEntry('export_generated', `CSV export created: ${outputPath}`, { outputPath });
      return outputPath;
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'CSV export failed',
        { outputPath },
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }
}

export function createCSVExporter(auditLogger: AuditLogger): CSVExporter {
  return new CSVExporter(auditLogger);
}
