/**
 * FIAE Excel Exporter
 * Generates professional multi-sheet Excel workbooks
 */

import ExcelJS from 'exceljs';
import { NormalizedFinancialModel, Transaction, TimeBucket, AuditLogEntry } from '@/types/fiae';
import * as fs from 'fs';
import { AuditLogger } from '@/lib/fiae/core/logger';

export class ExcelExporter {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  async export(model: NormalizedFinancialModel, outputPath: string): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();

      // Summary Sheet
      this.addSummarySheet(workbook, model);

      // Transactions Sheet
      this.addTransactionsSheet(workbook, model.transactions);

      // Time Buckets Sheet
      this.addTimeBucketsSheet(workbook, model.timeBuckets);

      // Calculations Sheet
      this.addCalculationsSheet(workbook, model.calculatedMetrics);

      // Assumptions Sheet
      this.addAssumptionsSheet(workbook, model.processDefinition);

      // Audit Trail Sheet
      this.addAuditTrailSheet(workbook, model.auditTrail);

      // Format all sheets
      workbook.worksheets.forEach(ws => {
        ws.properties.defaultColWidth = 15;
        ws.pageSetup.orientation = 'landscape';
      });

      await workbook.xlsx.writeFile(outputPath);

      const fileSize = fs.statSync(outputPath).size;

      this.auditLogger.addEntry('export_generated', `Excel export created: ${outputPath}`, {
        outputPath,
        fileSize,
        sheetCount: workbook.worksheets.length,
      });

      return outputPath;
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'Excel export failed',
        { outputPath },
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private addSummarySheet(workbook: ExcelJS.Workbook, model: NormalizedFinancialModel): void {
    const ws = workbook.addWorksheet('Summary');
    const metrics = model.calculatedMetrics;

    let row = 1;

    // Title
    ws.mergeCells(`A${row}:C${row}`);
    ws.getCell(`A${row}`).value = `Financial Report - ${model.processDefinition.processType}`;
    ws.getCell(`A${row}`).font = { bold: true, size: 14 };
    row += 2;

    // Key Metrics
    ws.getCell(`A${row}`).value = 'Metric';
    ws.getCell(`B${row}`).value = 'Value';
    ws.getCell(`A${row}`).font = { bold: true };
    ws.getCell(`B${row}`).font = { bold: true };
    row++;

    const metricsToDisplay = [
      ['Total Inflows', metrics.totalInflows],
      ['Total Outflows', metrics.totalOutflows],
      ['Net Cash Flow', metrics.netCashFlow],
      ['Ending Cash Balance', metrics.endingCashBalance],
      ['Average Daily Burn', metrics.averageDailyBurn],
      ['Runway (Months)', metrics.runway],
    ];

    for (const [label, value] of metricsToDisplay) {
      ws.getCell(`A${row}`).value = label;
      ws.getCell(`B${row}`).value = typeof value === 'number' ? value : 0;
      ws.getCell(`B${row}`).numFmt = '#,##0.00';
      row++;
    }

    row++;
    ws.getCell(`A${row}`).value = 'Process Type';
    ws.getCell(`B${row}`).value = model.processDefinition.processType;
    row++;

    ws.getCell(`A${row}`).value = 'Confidence';
    ws.getCell(`B${row}`).value = `${model.processDefinition.confidence}%`;
    row++;

    ws.getCell(`A${row}`).value = 'Generated';
    ws.getCell(`B${row}`).value = new Date();
    ws.getCell(`B${row}`).numFmt = 'yyyy-mm-dd hh:mm:ss';
  }

  private addTransactionsSheet(workbook: ExcelJS.Workbook, transactions: Transaction[]): void {
    const ws = workbook.addWorksheet('Transactions');

    // Headers
    const headers = ['Date', 'Entity', 'Category', 'Amount', 'Direction', 'Description', 'Reference', 'Status'];
    headers.forEach((h, i) => {
      ws.getCell(1, i + 1).value = h;
      ws.getCell(1, i + 1).font = { bold: true };
    });

    // Data
    transactions.forEach((tx, idx) => {
      const row = idx + 2;
      ws.getCell(row, 1).value = tx.date;
      ws.getCell(row, 1).numFmt = 'yyyy-mm-dd';
      ws.getCell(row, 2).value = tx.entity;
      ws.getCell(row, 3).value = tx.category;
      ws.getCell(row, 4).value = tx.amount;
      ws.getCell(row, 4).numFmt = '#,##0.00';
      ws.getCell(row, 5).value = tx.direction;
      ws.getCell(row, 6).value = tx.description;
      ws.getCell(row, 7).value = tx.reference;
      ws.getCell(row, 8).value = tx.status;
    });
  }

  private addTimeBucketsSheet(workbook: ExcelJS.Workbook, timeBuckets: TimeBucket[]): void {
    const ws = workbook.addWorksheet('Time Buckets');

    const headers = ['Period', 'Start Date', 'End Date', 'Inflows', 'Outflows', 'Net Cash', 'Transaction Count'];
    headers.forEach((h, i) => {
      ws.getCell(1, i + 1).value = h;
      ws.getCell(1, i + 1).font = { bold: true };
    });

    timeBuckets.forEach((tb, idx) => {
      const row = idx + 2;
      ws.getCell(row, 1).value = tb.period;
      ws.getCell(row, 2).value = tb.startDate;
      ws.getCell(row, 2).numFmt = 'yyyy-mm-dd';
      ws.getCell(row, 3).value = tb.endDate;
      ws.getCell(row, 3).numFmt = 'yyyy-mm-dd';
      ws.getCell(row, 4).value = tb.inflows;
      ws.getCell(row, 4).numFmt = '#,##0.00';
      ws.getCell(row, 5).value = tb.outflows;
      ws.getCell(row, 5).numFmt = '#,##0.00';
      ws.getCell(row, 6).value = tb.netCash;
      ws.getCell(row, 6).numFmt = '#,##0.00';
      ws.getCell(row, 7).value = tb.transactions.length;
    });
  }

  private addCalculationsSheet(workbook: ExcelJS.Workbook, metrics: any): void {
    const ws = workbook.addWorksheet('Calculations');
    ws.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Formula', key: 'formula', width: 40 }
    ];

    let row = 1;
    ws.getCell(row, 1).value = 'Calculated Metrics';
    ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF0F766E' } };
    ws.mergeCells(`A${row}:C${row}`);
    row += 2;

    ws.getCell(row, 1).value = 'Metric';
    ws.getCell(row, 2).value = 'Value';
    ws.getCell(row, 3).value = 'Formula/Notes';
    [ws.getCell(row, 1), ws.getCell(row, 2), ws.getCell(row, 3)].forEach(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
      cell.alignment = { horizontal: 'center' };
    });
    row++;

    const metricsDisplay = [
      ['Total Inflows', metrics.totalInflows, 'SUM of all inflow transactions'],
      ['Total Outflows', metrics.totalOutflows, 'SUM of all outflow transactions'],
      ['Net Cash Flow', metrics.netCashFlow, 'Inflows - Outflows'],
      ['Average Daily Burn', metrics.averageDailyBurn, 'Total Outflows / Number of Days'],
      ['Runway (Months)', metrics.runway, 'Cash Balance / Daily Burn Rate'],
      ['Days Sales Outstanding', metrics.daysOfSalesOutstanding, '(AR * Days) / Revenue'],
      ['Days Payable Outstanding', metrics.daysPayableOutstanding, '(AP * Days) / COGS'],
    ];

    metricsDisplay.forEach(([label, value, formula]) => {
      ws.getCell(row, 1).value = label;
      ws.getCell(row, 2).value = typeof value === 'number' ? value : 0;
      ws.getCell(row, 2).numFmt = '#,##0.00';
      ws.getCell(row, 3).value = formula;
      ws.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      row++;
    });
  }

  private addAssumptionsSheet(workbook: ExcelJS.Workbook, processDefinition: any): void {
    const ws = workbook.addWorksheet('Assumptions');

    let row = 1;
    ws.getCell(row, 1).value = 'Process Definition';
    ws.getCell(row, 1).font = { bold: true, size: 12 };
    row += 2;

    const fields = [
      ['Process Type', processDefinition.processType],
      ['Time Granularity', processDefinition.timeGranularity],
      ['Confidence', `${processDefinition.confidence}%`],
      ['Inflow Sources', processDefinition.inflowSources.join(', ')],
      ['Outflow Sources', processDefinition.outflowSources.join(', ')],
      ['Entity Dimensions', processDefinition.entityDimensions.join(', ')],
    ];

    fields.forEach(([label, value]) => {
      ws.getCell(row, 1).value = label;
      ws.getCell(row, 2).value = value;
      row++;
    });
  }

  private addAuditTrailSheet(workbook: ExcelJS.Workbook, auditTrail: AuditLogEntry[]): void {
    const ws = workbook.addWorksheet('Audit Trail');

    const headers = ['Timestamp', 'Event Type', 'Description', 'Details'];
    headers.forEach((h, i) => {
      ws.getCell(1, i + 1).value = h;
      ws.getCell(1, i + 1).font = { bold: true };
    });

    auditTrail.forEach((entry, idx) => {
      const row = idx + 2;
      ws.getCell(row, 1).value = entry.timestamp;
      ws.getCell(row, 1).numFmt = 'yyyy-mm-dd hh:mm:ss';
      ws.getCell(row, 2).value = entry.eventType;
      ws.getCell(row, 3).value = entry.description;
      ws.getCell(row, 4).value = JSON.stringify(entry.details).substring(0, 100);
    });
  }
}

export async function exportToExcel(
  model: NormalizedFinancialModel,
  outputPath: string,
  auditLogger: AuditLogger
): Promise<string> {
  const exporter = new ExcelExporter(auditLogger);
  return exporter.export(model, outputPath);
}
