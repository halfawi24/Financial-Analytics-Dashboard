/**
 * FIAE Data Validator
 * Validates inputs, ranges, consistency
 */

import { Transaction, TimeBucket, ProcessDefinition } from '@/types/fiae';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class Validator {
  validateTransaction(tx: Transaction): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!tx.id) errors.push('Transaction missing ID');
    if (!tx.date) errors.push('Transaction missing date');
    if (isNaN(tx.amount)) errors.push('Transaction amount is not a number');
    if (tx.amount === 0) warnings.push('Transaction amount is zero');
    if (!tx.direction) errors.push('Transaction missing direction');
    if (!['inflow', 'outflow', 'both'].includes(tx.direction)) {
      errors.push(`Invalid direction: ${tx.direction}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateTimeBucket(bucket: TimeBucket): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!bucket.period) errors.push('TimeBucket missing period');
    if (!bucket.startDate) errors.push('TimeBucket missing startDate');
    if (!bucket.endDate) errors.push('TimeBucket missing endDate');
    if (bucket.startDate >= bucket.endDate) {
      errors.push('startDate must be before endDate');
    }
    if (isNaN(bucket.netCash)) errors.push('netCash is not a number');

    // Validate consistency
    const txTotal = bucket.transactions.reduce((sum, tx) => {
      return sum + (tx.direction === 'inflow' ? tx.amount : -tx.amount);
    }, 0);

    if (Math.abs(txTotal - bucket.netCash) > 0.01) {
      warnings.push(`Transaction sum (${txTotal}) doesn't match netCash (${bucket.netCash})`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateProcessDefinition(def: ProcessDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!['revenue_ar', 'ap_expense', 'budget_actual', 'fund_ops', 'mixed_ops'].includes(def.processType)) {
      errors.push(`Invalid processType: ${def.processType}`);
    }
    if (def.confidence < 0 || def.confidence > 100) {
      errors.push('Confidence must be between 0 and 100');
    }
    if (!Array.isArray(def.inflowSources)) errors.push('inflowSources must be an array');
    if (!Array.isArray(def.outflowSources)) errors.push('outflowSources must be an array');

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateAmountRange(
    amount: number,
    min: number = -Infinity,
    max: number = Infinity
  ): { isValid: boolean; error?: string } {
    if (amount < min) return { isValid: false, error: `Amount ${amount} below minimum ${min}` };
    if (amount > max) return { isValid: false, error: `Amount ${amount} exceeds maximum ${max}` };
    return { isValid: true };
  }

  validateDateSequence(dates: Date[]): { isValid: boolean; error?: string } {
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] < dates[i - 1]) {
        return { isValid: false, error: `Date sequence broken at index ${i}` };
      }
    }
    return { isValid: true };
  }
}

export const validator = new Validator();
