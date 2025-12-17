/**
 * FIAE File Parser
 * Parses XLSX and CSV files, extracts metadata, classifies sheets
 */

import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { RawFileMetadata, FileFormat, SheetClassification, ColumnInference, ColumnSemanticType, SchemaInference } from '@/types/fiae';
import { AuditLogger } from '@/lib/fiae/core/logger';

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rawData: unknown[][];
}

export interface ParsedFile {
  metadata: RawFileMetadata;
  sheets: ParsedSheet[];
}

export class FileParser {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  async parseFile(filePath: string): Promise<ParsedFile> {
    try {
      const format: FileFormat = filePath.endsWith('.csv') ? 'csv' : 'xlsx';
      const fileStats = fs.statSync(filePath);

      const metadata: RawFileMetadata = {
        filename: filePath.split('/').pop() || 'unknown',
        format,
        uploadedAt: new Date(),
        fileSizeBytes: fileStats.size,
      };

      let sheets: ParsedSheet[];

      if (format === 'xlsx') {
        sheets = this.parseXLSX(filePath);
        metadata.sheets = sheets.map(s => s.name);
      } else {
        sheets = [this.parseCSV(filePath)];
      }

      metadata.rowCount = sheets.reduce((sum, s) => sum + s.rows.length, 0);
      metadata.columnCount = sheets[0]?.headers.length || 0;

      this.auditLogger.addEntry(
        'file_ingested',
        `Ingested file: ${metadata.filename} (${format.toUpperCase()})`,
        { filename: metadata.filename, format, rowCount: metadata.rowCount, sheetCount: sheets.length }
      );

      return { metadata, sheets };
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'File parsing failed',
        { filePath },
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private parseXLSX(filePath: string): ParsedSheet[] {
    const workbook = XLSX.readFile(filePath);
    const sheets: ParsedSheet[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      const headers = (rawData[0] || []) as string[];
      const sheetRows = XLSX.utils.sheet_to_json(worksheet);

      sheets.push({
        name: sheetName,
        headers: headers.map(h => String(h).trim()),
        rows: sheetRows as Record<string, unknown>[],
        rawData,
      });
    }

    return sheets;
  }

  private parseCSV(filePath: string): ParsedSheet {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, unknown>[];

    const headers = records.length > 0 ? Object.keys(records[0]) : [];

    return {
      name: 'default',
      headers,
      rows: records,
      rawData: [headers, ...records.map(r => Object.values(r))],
    };
  }

  inferSchema(parsedFile: ParsedFile): SchemaInference {
    const sheets = parsedFile.sheets.map(sheet => this.classifySheet(sheet));
    const overallConfidence = sheets.length > 0
      ? sheets.reduce((sum, s) => sum + s.confidence, 0) / sheets.length
      : 0;

    const flaggedLowConfidenceColumns = sheets
      .flatMap(s => s.columnInferences)
      .filter(c => c.confidence < 70);

    const inference: SchemaInference = {
      fileMetadata: parsedFile.metadata,
      sheets,
      overallConfidence,
      flaggedLowConfidenceColumns,
    };

    this.auditLogger.addEntry(
      'schema_inferred',
      `Inferred schema for ${parsedFile.metadata.filename}`,
      { overallConfidence, sheetCount: sheets.length, lowConfidenceColumnCount: flaggedLowConfidenceColumns.length }
    );

    return inference;
  }

  private classifySheet(sheet: ParsedSheet): SheetClassification {
    const columnInferences = sheet.headers.map(header => this.inferColumnSemantic(header, sheet.rows));
    const sheetType = this.detectSheetType(sheet.headers, columnInferences);
    
    const detectedSemantics = columnInferences.filter(c => c.confidence >= 70).length;
    const totalColumns = columnInferences.length;
    const confidence = totalColumns > 0 ? (detectedSemantics / totalColumns) * 100 : 0;

    return {
      sheetName: sheet.name,
      sheetType,
      confidence,
      columnInferences,
    };
  }

  private inferColumnSemantic(
    headerName: string,
    rows: Record<string, unknown>[]
  ): ColumnInference {
    const normalized = headerName.toLowerCase().trim();
    const sampleValues = rows.slice(0, 100).map(r => r[headerName]).filter(v => v !== null && v !== undefined);

    let semanticType: ColumnSemanticType = 'unknown';
    let confidence = 0;

    // Date detection
    if (/date|time|created|posted|period/i.test(normalized)) {
      const dateCount = sampleValues.filter(v => !isNaN(Date.parse(String(v)))).length;
      if (dateCount / sampleValues.length > 0.8) {
        semanticType = 'date';
        confidence = 95;
      }
    }

    // Amount detection
    if (/amount|value|balance|total|cost|revenue|expense|inflow|outflow/i.test(normalized)) {
      const numCount = sampleValues.filter(v => !isNaN(Number(v))).length;
      if (numCount / sampleValues.length > 0.8) {
        semanticType = 'amount';
        confidence = 90;
      }
    }

    // Entity detection
    if (/entity|department|project|fund|account|client|vendor|supplier/i.test(normalized)) {
      semanticType = 'entity';
      confidence = 85;
    }

    // Category detection
    if (/category|type|class|kind|segment|region|location/i.test(normalized)) {
      semanticType = 'category';
      confidence = 80;
    }

    // Direction detection
    if (/direction|flow|type|inflow|outflow|in|out/i.test(normalized)) {
      const directionCount = sampleValues.filter(v =>
        ['inflow', 'outflow', 'in', 'out', '+', '-'].includes(String(v).toLowerCase())
      ).length;
      if (directionCount / sampleValues.length > 0.7) {
        semanticType = 'direction';
        confidence = 85;
      }
    }

    return {
      columnName: headerName,
      semanticType,
      confidence,
    };
  }

  private detectSheetType(
    headers: string[],
    columnInferences: ColumnInference[]
  ): SheetClassification['sheetType'] {
    const headerLower = headers.join(' ').toLowerCase();

    if (/budget|forecast|plan|projection/i.test(headerLower)) return 'budget';
    if (/transaction|invoice|bill|payment|receipt/i.test(headerLower)) return 'transactions';
    if (/master|master.data|chart.of.accounts|reference|lookup/i.test(headerLower)) return 'master_data';
    if (/actual|realization|fact|recorded/i.test(headerLower)) return 'forecast';
    if (/assumption|parameter|config|setting/i.test(headerLower)) return 'assumptions';

    const hasAmounts = columnInferences.some(c => c.semanticType === 'amount');
    const hasDates = columnInferences.some(c => c.semanticType === 'date');

    if (hasAmounts && hasDates) return 'transactions';
    if (hasAmounts) return 'master_data';

    return 'unknown';
  }
}

export function createFileParser(auditLogger: AuditLogger): FileParser {
  return new FileParser(auditLogger);
}
