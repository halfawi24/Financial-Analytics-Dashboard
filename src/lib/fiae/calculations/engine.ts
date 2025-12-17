/**
 * FIAE Deterministic Calculation Engine
 * All calculations are deterministic (no AI math), fully tested, reproducible
 */

import {
  Transaction,
  TimeBucket,
  NormalizedFinancialModel,
  CalculatedMetrics,
  ScenarioSimulation,
} from '@/types/fiae';
import { AuditLogger } from '@/lib/fiae/core/logger';

export interface VarianceAnalysis {
  metric: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'favorable' | 'unfavorable' | 'neutral';
}

export class CalculationEngine {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  calculate(model: NormalizedFinancialModel): NormalizedFinancialModel {
    // Main entry point - calculates all metrics and returns updated model
    const metrics = this.calculateMetrics(model);
    return {
      ...model,
      calculatedMetrics: metrics,
    };
  }

  calculateCashFlow(timeBuckets: TimeBucket[]): { monthly: number[]; cumulative: number[] } {
    const monthly = timeBuckets.map(b => b.netCash);
    const cumulative: number[] = [];
    let running = 0;

    for (const m of monthly) {
      running += m;
      cumulative.push(running);
    }

    return { monthly, cumulative };
  }

  calculateMetrics(model: NormalizedFinancialModel): CalculatedMetrics {
    const transactions = model.transactions;
    const timeBuckets = model.timeBuckets;

    const totalInflows = transactions
      .filter(t => t.direction === 'inflow')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflows = transactions
      .filter(t => t.direction === 'outflow')
      .reduce((sum, t) => sum + t.amount, 0);

    const netCash = totalInflows - totalOutflows;
    const endingCash = timeBuckets.length > 0 ? timeBuckets[timeBuckets.length - 1].netCash : netCash;

    // Calculate burn rate (average daily outflows)
    const daySpan = this.calculateDaySpan(transactions);
    const dailyBurn = daySpan > 0 ? totalOutflows / daySpan : 0;

    // Calculate runway (months remaining at current burn rate)
    const runway = dailyBurn > 0 ? (endingCash / dailyBurn) / 30 : Infinity;

    // Working capital metrics
    const dso = this.calculateDSO(model);
    const dpo = this.calculateDPO(model);

    const metrics: CalculatedMetrics = {
      totalInflows,
      totalOutflows,
      netCashFlow: netCash,
      endingCashBalance: endingCash,
      averageDailyBurn: dailyBurn,
      runway: isFinite(runway) ? runway : 0,
      totalRevenue: totalInflows,
      averageRevenuePerPeriod: timeBuckets.length > 0 ? totalInflows / timeBuckets.length : 0,
      daysOfSalesOutstanding: dso,
      daysPayableOutstanding: dpo,
      custom: {},
    };

    this.auditLogger.addEntry('calculations_run', 'Calculated metrics', {
      totalInflows,
      totalOutflows,
      netCash,
      runway,
      dso,
      dpo,
    });

    return metrics;
  }

  calculateVarianceAnalysis(
    budgetMetrics: CalculatedMetrics,
    actualMetrics: CalculatedMetrics
  ): VarianceAnalysis[] {
    const analyses: VarianceAnalysis[] = [];

    const metrics: (keyof CalculatedMetrics)[] = [
      'totalInflows',
      'totalOutflows',
      'netCashFlow',
      'endingCashBalance',
    ];

    for (const metricKey of metrics) {
      const budget = (budgetMetrics[metricKey] as number) || 0;
      const actual = (actualMetrics[metricKey] as number) || 0;
      const variance = actual - budget;
      const variancePercent = budget !== 0 ? (variance / budget) * 100 : 0;

      let status: 'favorable' | 'unfavorable' | 'neutral' = 'neutral';
      if (Math.abs(variancePercent) < 5) {
        status = 'neutral';
      } else if (metricKey === 'totalOutflows') {
        // Lower outflows = favorable
        status = variance < 0 ? 'favorable' : 'unfavorable';
      } else {
        // Higher inflows/cash = favorable
        status = variance > 0 ? 'favorable' : 'unfavorable';
      }

      analyses.push({
        metric: metricKey,
        budget,
        actual,
        variance,
        variancePercent,
        status,
      });
    }

    return analyses;
  }

  simulateScenario(
    model: NormalizedFinancialModel,
    scenarioName: string,
    parameters: {
      revenueMultiplier?: number;
      costMultiplier?: number;
      paymentDelayDays?: number;
      paymentAccelerationDays?: number;
    }
  ): ScenarioSimulation {
    const modifiedTransactions = model.transactions.map(tx => {
      const modified = { ...tx };

      if (parameters.revenueMultiplier && tx.direction === 'inflow') {
        modified.amount *= parameters.revenueMultiplier;
      }

      if (parameters.costMultiplier && tx.direction === 'outflow') {
        modified.amount *= parameters.costMultiplier;
      }

      if (parameters.paymentDelayDays && tx.direction === 'outflow') {
        modified.date = new Date(modified.date.getTime() + parameters.paymentDelayDays * 24 * 60 * 60 * 1000);
      }

      if (parameters.paymentAccelerationDays && tx.direction === 'inflow') {
        modified.date = new Date(modified.date.getTime() - parameters.paymentAccelerationDays * 24 * 60 * 60 * 1000);
      }

      return modified;
    });

    const modifiedModel = { ...model, transactions: modifiedTransactions };
    const projectedMetrics = this.calculateMetrics(modifiedModel);

    return {
      scenarioName,
      description: `Scenario: ${scenarioName}`,
      parameters,
      projectedMetrics,
      assumptions: model.processDefinition.assumptions,
    };
  }

  private calculateDaySpan(transactions: Transaction[]): number {
    if (transactions.length === 0) return 1;

    const dates = transactions.map(t => t.date.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    return (maxDate - minDate) / (1000 * 60 * 60 * 24);
  }

  private calculateDSO(model: NormalizedFinancialModel): number {
    // Days Sales Outstanding: (AR / Revenue) * Number of Days
    const arTransactions = model.transactions.filter(t =>
      t.category.toLowerCase().includes('receivable') || t.status === 'pending'
    );

    const totalAR = arTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalRevenue = model.transactions
      .filter(t => t.direction === 'inflow')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalRevenue === 0) return 0;

    const daySpan = this.calculateDaySpan(model.transactions);
    return (totalAR / totalRevenue) * daySpan;
  }

  private calculateDPO(model: NormalizedFinancialModel): number {
    // Days Payable Outstanding: (AP / COGS or Expenses) * Number of Days
    const apTransactions = model.transactions.filter(t =>
      t.category.toLowerCase().includes('payable') || 
      t.category.toLowerCase().includes('expense')
    );

    const totalAP = apTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = model.transactions
      .filter(t => t.direction === 'outflow')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalExpenses === 0) return 0;

    const daySpan = this.calculateDaySpan(model.transactions);
    return (totalAP / totalExpenses) * daySpan;
  }

  // Deterministic forecast function
  forecastCashFlow(
    model: NormalizedFinancialModel,
    forecastMonths: number,
    growthRate: number = 0.05
  ): TimeBucket[] {
    const lastBucket = model.timeBuckets[model.timeBuckets.length - 1];
    if (!lastBucket) return [];

    const forecast: TimeBucket[] = [];
    const currentDate = new Date(lastBucket.endDate);
    let currentInflow = lastBucket.inflows * (1 + growthRate);
    const currentOutflow = lastBucket.outflows;

    for (let i = 0; i < forecastMonths; i++) {
      const startDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
      const endDate = new Date(currentDate);

      forecast.push({
        period: `FORECAST-${i + 1}`,
        startDate,
        endDate,
        transactions: [],
        inflows: currentInflow,
        outflows: currentOutflow,
        netCash: currentInflow - currentOutflow,
      });

      currentInflow *= 1 + growthRate;
    }

    return forecast;
  }
}

export function createCalculationEngine(auditLogger: AuditLogger): CalculationEngine {
  return new CalculationEngine(auditLogger);
}
