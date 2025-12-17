/**
 * FIAE Data Normalizer
 * Converts raw data into unified internal financial model
 */

import {
  ProcessDefinition,
  NormalizedFinancialModel,
  Transaction,
  TimeBucket,
  EntityHierarchy,
  CalculatedMetrics,
} from '@/types/fiae';
import type { ParsedSheet } from '@/lib/fiae/pipeline/file-parser';
import { AuditLogger } from '@/lib/fiae/core/logger';
import { v4 as uuidv4 } from 'uuid';

export class DataNormalizer {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  normalize(
    sheets: ParsedSheet[],
    processDefinition: ProcessDefinition
  ): NormalizedFinancialModel {
    try {
      // Extract transactions from parsed sheets
      const transactions = this.extractTransactions(sheets, processDefinition);
      
      // Extract entities
      const entities = this.extractEntities(sheets, processDefinition);
      
      // Create time buckets
      const timeBuckets = this.createTimeBuckets(transactions, processDefinition.timeGranularity);
      
      // Create normalized model
      const model: NormalizedFinancialModel = {
        processDefinition,
        entities,
        transactions,
        timeBuckets,
        calculatedMetrics: this.calculateMetrics(transactions, timeBuckets),
        auditTrail: this.auditLogger.getEntries(),
      };

      this.auditLogger.addEntry(
        'data_normalized',
        'Data normalized into internal model',
        {
          transactionCount: transactions.length,
          entityCount: entities.length,
          timeBucketCount: timeBuckets.length,
        }
      );

      return model;
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'Data normalization failed',
        {},
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private extractTransactions(sheets: ParsedSheet[], processDefinition: ProcessDefinition): Transaction[] {
    const transactions: Transaction[] = [];

    sheets.forEach(sheet => {
      sheet.rows.forEach((row: Record<string, unknown>) => {
        // Find date column
        const dateColumn = Object.keys(row).find(k =>
          /date|time|created|posted|period/i.test(k)
        );
        
        // Find amount column
        const amountColumn = Object.keys(row).find(k =>
          /amount|value|balance|total|cost|revenue|expense/i.test(k)
        );

        if (dateColumn && amountColumn) {
          const direction = this.inferDirection(row, processDefinition);
          const amount = Math.abs(Number(row[amountColumn]) || 0);

          const transaction: Transaction = {
            id: uuidv4(),
            date: new Date(String(row[dateColumn])),
            entity: String(row[Object.keys(row).find(k => /entity|department|project/i.test(k)) || 'unknown']),
            amount,
            direction,
            category: String(row[Object.keys(row).find(k => /category|type|class/i.test(k)) || 'other']),
            description: String(row[Object.keys(row).find(k => /description|memo|note/i.test(k)) || '']),
            reference: String(row[Object.keys(row).find(k => /reference|id|invoice|bill/i.test(k)) || '']),
            isAccrual: this.detectAccrual(row),
            status: this.inferStatus(row),
            metadata: row,
          };

          transactions.push(transaction);
        }
      });
    });

    return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private extractEntities(sheets: ParsedSheet[], processDefinition: ProcessDefinition): EntityHierarchy[] {
    const entities = new Map<string, EntityHierarchy>();

    sheets.forEach(sheet => {
      sheet.rows.forEach((row: Record<string, unknown>) => {
        processDefinition.entityDimensions.forEach(dimension => {
          const entityValue = String(row[dimension] || 'unknown');
          if (!entities.has(entityValue)) {
            entities.set(entityValue, {
              id: uuidv4(),
              name: entityValue,
              entityType: dimension,
              metadata: {},
            });
          }
        });
      });
    });

    return Array.from(entities.values());
  }

  private createTimeBuckets(
    transactions: Transaction[],
    granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  ): TimeBucket[] {
    const buckets = new Map<string, Transaction[]>();

    transactions.forEach(tx => {
      const period = this.formatPeriod(tx.date, granularity);
      if (!buckets.has(period)) {
        buckets.set(period, []);
      }
      buckets.get(period)!.push(tx);
    });

    return Array.from(buckets.entries()).map(([period, txns]) => {
      const inflows = txns
        .filter(t => t.direction === 'inflow')
        .reduce((sum, t) => sum + t.amount, 0);
      const outflows = txns
        .filter(t => t.direction === 'outflow')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        period,
        startDate: txns[0].date,
        endDate: txns[txns.length - 1].date,
        transactions: txns,
        netCash: inflows - outflows,
        inflows,
        outflows,
      };
    });
  }

  private calculateMetrics(transactions: Transaction[], timeBuckets: TimeBucket[]): CalculatedMetrics {
    const totalInflows = transactions
      .filter(t => t.direction === 'inflow')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalOutflows = transactions
      .filter(t => t.direction === 'outflow')
      .reduce((sum, t) => sum + t.amount, 0);

    const endingCashBalance = totalInflows - totalOutflows;
    const dayCount = timeBuckets.length || 1;
    const averageDailyBurn = totalOutflows / dayCount;

    return {
      totalInflows,
      totalOutflows,
      netCashFlow: endingCashBalance,
      endingCashBalance,
      averageDailyBurn: averageDailyBurn > 0 ? averageDailyBurn : 0,
      runway: averageDailyBurn > 0 ? endingCashBalance / averageDailyBurn : Infinity,
      totalRevenue: totalInflows,
      averageRevenuePerPeriod: totalInflows / dayCount,
      custom: {},
    };
  }

  private inferDirection(row: Record<string, unknown>, processDefinition: ProcessDefinition): 'inflow' | 'outflow' | 'both' {
    const dataStr = JSON.stringify(row).toLowerCase();
    
    if (processDefinition.inflowSources.some(src => dataStr.includes(src))) {
      return 'inflow';
    }
    if (processDefinition.outflowSources.some(src => dataStr.includes(src))) {
      return 'outflow';
    }

    // Default heuristic: check for negative amounts = outflow
    const amountValue = Object.values(row).find(v => typeof v === 'number');
    if (typeof amountValue === 'number' && amountValue < 0) {
      return 'outflow';
    }

    return 'both';
  }

  private detectAccrual(row: Record<string, unknown>): boolean {
    const dataStr = JSON.stringify(row).toLowerCase();
    return /accrual|accrued|accruing/i.test(dataStr);
  }

  private inferStatus(row: Record<string, unknown>): 'posted' | 'pending' | 'scheduled' {
    const statusValue = Object.entries(row)
      .find(([k]) => /status|state|condition/i.test(k))?.[1];

    if (!statusValue) return 'posted';
    
    const statusStr = String(statusValue).toLowerCase();
    if (statusStr.includes('pending') || statusStr.includes('draft')) return 'pending';
    if (statusStr.includes('scheduled') || statusStr.includes('future')) return 'scheduled';
    return 'posted';
  }

  private formatPeriod(date: Date, granularity: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (granularity) {
      case 'daily':
        return `${year}-${month}-${day}`;
      case 'weekly':
        const week = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7);
        return `${year}-W${String(week).padStart(2, '0')}`;
      case 'monthly':
        return `${year}-${month}`;
      case 'quarterly':
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        return `${year}-Q${quarter}`;
      case 'annual':
        return String(year);
      default:
        return `${year}-${month}`;
    }
  }
}

export function createNormalizer(auditLogger: AuditLogger): DataNormalizer {
  return new DataNormalizer(auditLogger);
}
