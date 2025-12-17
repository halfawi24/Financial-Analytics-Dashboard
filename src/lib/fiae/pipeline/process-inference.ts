/**
 * FIAE Process Inference Engine
 * Detects business process type from schema
 */

import { ProcessDefinition, ProcessType, SchemaInference } from '@/types/fiae';
import { AuditLogger } from '@/lib/fiae/core/logger';

export class ProcessInferenceEngine {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  infer(schema: SchemaInference): ProcessDefinition {
    try {
      // Analyze all sheets to determine process type
      const inflowIndicators = this.countIndicators(schema, 'inflow');
      const outflowIndicators = this.countIndicators(schema, 'outflow');
      const budgetIndicators = this.countIndicators(schema, 'budget');
      const fundIndicators = this.countIndicators(schema, 'fund');

      let processType: ProcessType = 'mixed_ops';
      let reasoning = '';
      let confidence = 50;

      // Revenue / AR Process
      if (inflowIndicators > outflowIndicators && !budgetIndicators) {
        processType = 'revenue_ar';
        reasoning = 'Detected inflow-focused process with transaction patterns typical of revenue/AR';
        confidence = 85;
      }
      // AP / Expense Process
      else if (outflowIndicators > inflowIndicators && !budgetIndicators) {
        processType = 'ap_expense';
        reasoning = 'Detected outflow-focused process with expense/AP patterns';
        confidence = 85;
      }
      // Budget vs Actual
      else if (budgetIndicators > 0) {
        processType = 'budget_actual';
        reasoning = 'Detected budget/actual variance analysis structure';
        confidence = 90;
      }
      // Fund Operations
      else if (fundIndicators > 0) {
        processType = 'fund_ops';
        reasoning = 'Detected fund operations structure with inflows and outflows';
        confidence = 80;
      }
      // Mixed Operations (default)
      else {
        processType = 'mixed_ops';
        reasoning = 'Detected mixed operational finance with both inflows and outflows';
        confidence = 70;
      }

      const processDefinition: ProcessDefinition = {
        processType,
        timeGranularity: this.inferTimeGranularity(),
        inflowSources: this.extractInflowSources(schema, processType),
        outflowSources: this.extractOutflowSources(schema, processType),
        entityDimensions: this.extractEntityDimensions(schema),
        assumptions: {},
        confidence,
        inferenceReasoning: reasoning,
      };

      this.auditLogger.addEntry(
        'process_detected',
        `Detected process type: ${processType}`,
        { processType, confidence, reasoning }
      );

      return processDefinition;
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'Process inference failed',
        {},
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private countIndicators(schema: SchemaInference, type: 'inflow' | 'outflow' | 'budget' | 'fund'): number {
    let count = 0;

    schema.sheets.forEach(sheet => {
      const sheetNameLower = sheet.sheetName.toLowerCase();
      
      if (type === 'inflow' && /revenue|sales|income|receipt|customer|ar|receivable/i.test(sheetNameLower)) {
        count++;
      }
      if (type === 'outflow' && /expense|cost|payment|bill|vendor|ap|payable/i.test(sheetNameLower)) {
        count++;
      }
      if (type === 'budget' && /budget|forecast|plan|projection|expected|planned/i.test(sheetNameLower)) {
        count++;
      }
      if (type === 'fund' && /fund|inflow|deployment|drawdown|allocation/i.test(sheetNameLower)) {
        count++;
      }
    });

    return count;
  }

  private inferTimeGranularity(): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' {
    // Examine sample data to detect temporal granularity
    // For now, default to monthly (most common in financial reporting)
    return 'monthly';
  }

  private extractInflowSources(schema: SchemaInference, processType: ProcessType): string[] {
    const sources = new Set<string>();

    schema.sheets.forEach(sheet => {
      if (processType === 'revenue_ar' && /revenue|sales|income/i.test(sheet.sheetName)) {
        sources.add('revenue');
      }
      if (processType === 'fund_ops' && /inflow|deployment|contribution|grant/i.test(sheet.sheetName)) {
        sources.add('fundraising');
        sources.add('grants');
      }
      if (processType === 'mixed_ops') {
        if (/revenue|sales|income|receipt/i.test(sheet.sheetName)) sources.add('revenue');
        if (/interest|dividend|other/i.test(sheet.sheetName)) sources.add('other_income');
      }
    });

    return Array.from(sources) || ['other'];
  }

  private extractOutflowSources(schema: SchemaInference, processType: ProcessType): string[] {
    const sources = new Set<string>();

    schema.sheets.forEach(sheet => {
      if (processType === 'ap_expense' && /expense|cost|bill/i.test(sheet.sheetName)) {
        sources.add('operating_expenses');
      }
      if (processType === 'fund_ops' && /operational|deployment|distribution/i.test(sheet.sheetName)) {
        sources.add('operations');
        sources.add('distributions');
      }
      if (processType === 'mixed_ops') {
        if (/expense|operational|payroll|rent/i.test(sheet.sheetName)) sources.add('operating_expenses');
        if (/capital|capex|investment/i.test(sheet.sheetName)) sources.add('capital_expenditure');
      }
    });

    return Array.from(sources) || ['other'];
  }

  private extractEntityDimensions(schema: SchemaInference): string[] {
    const dimensions = new Set<string>();

    schema.sheets.forEach(sheet => {
      sheet.columnInferences.forEach(col => {
        if (col.semanticType === 'entity') {
          if (/department|division/i.test(col.columnName)) dimensions.add('department');
          if (/project|initiative/i.test(col.columnName)) dimensions.add('project');
          if (/fund|allocation/i.test(col.columnName)) dimensions.add('fund');
          if (/entity|company|account/i.test(col.columnName)) dimensions.add('entity');
        }
      });
    });

    return Array.from(dimensions) || [];
  }
}

export function createProcessInferenceEngine(auditLogger: AuditLogger): ProcessInferenceEngine {
  return new ProcessInferenceEngine(auditLogger);
}
