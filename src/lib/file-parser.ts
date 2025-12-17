// Financial file parser service
// Automatically extracts and maps financial data from CSV/Excel files
// Supports both CSV and XLSX formats with real data extraction

import * as XLSX from 'xlsx';

interface ParsedFinancialData {
  month1Revenue?: number;
  monthlyGrowth?: number;
  cogsPercent?: number;
  monthlyOpex?: number;
  monthlyCapex?: number;
  taxRate?: number;
  arDays?: number;
  apDays?: number;
  loanAmount?: number;
  loanRate?: number;
  loanTerm?: number;
}

interface ColumnMapping {
  [key: string]: string; // CSV column name -> financial field name
}

interface ColumnStatistics {
  values: number[];
  average: number;
  median: number;
  growth: number;
  stdDev: number;
  confidence: number;
}

// Common financial field aliases
const FINANCIAL_FIELDS: Record<string, string[]> = {
  revenue: ['revenue', 'sales', 'total revenue', 'gross sales', 'monthly revenue', 'income'],
  cogs: ['cogs', 'cost of goods sold', 'cost of sales', 'cost', 'expenses'],
  opex: ['opex', 'operating expenses', 'operating expense', 'operating costs', 'sg&a'],
  capex: ['capex', 'capital expenditure', 'capital expenses', 'fixed assets'],
  ebitda: ['ebitda', 'earnings before', 'ebit'],
  growthRate: ['growth', 'growth rate', 'monthly growth', 'growth %', 'cagr'],
  arDays: ['ar days', 'accounts receivable', 'ar', 'days sales outstanding', 'dso'],
  apDays: ['ap days', 'accounts payable', 'ap', 'days payable outstanding', 'dpo'],
  loanAmount: ['loan', 'loan amount', 'debt', 'principal', 'credit'],
  loanRate: ['loan rate', 'interest rate', 'rate', 'apr', 'interest'],
  taxRate: ['tax rate', 'tax %', 'taxes', 'tax'],
};

// Normalize column header for matching
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[_\s-]+/g, ' ');
}

// Calculate statistics from numerical column
function calculateColumnStats(values: number[]): ColumnStatistics {
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v) && v !== 0);
  
  if (validValues.length === 0) {
    return { values: [], average: 0, median: 0, growth: 0, stdDev: 0, confidence: 0 };
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  const average = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Calculate growth rate (if we have multiple values, estimate trend)
  let growth = 0;
  if (validValues.length > 1) {
    const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
    const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    growth = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  }

  // Calculate standard deviation
  const variance = validValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);

  // Confidence based on how consistent the data is
  const coefficientOfVariation = average > 0 ? stdDev / average : 0;
  let confidence = 100;
  if (coefficientOfVariation > 0.5) confidence = 70; // High variance = lower confidence
  if (coefficientOfVariation > 1) confidence = 50;
  if (validValues.length < 3) confidence = Math.min(confidence, 60); // Too few samples

  return { values: validValues, average, median, growth, stdDev, confidence };
}

// Detect financial fields from column headers with improved matching
export function detectFinancialColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    
    Object.entries(FINANCIAL_FIELDS).forEach(([fieldKey, aliases]) => {
      if (aliases.some(alias => normalized.includes(alias))) {
        mapping[header] = fieldKey;
      }
    });
  });
  
  return mapping;
}

// Parse CSV string into data with improved handling
export function parseCSV(csvContent: string): { headers: string[], rows: Record<string, any>[] } {
  const lines = csvContent.trim().split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 1) throw new Error('Empty CSV file');
  
  // Handle both comma and semicolon delimiters
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
  
  if (headers.length === 0) throw new Error('No columns detected in CSV');
  
  const rows: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row: Record<string, any> = {};
    const values = line.split(delimiter).map(v => v.trim());
    
    headers.forEach((header, idx) => {
      const value = values[idx] || '';
      // Try to parse as number, handle various formats
      const numValue = parseFloat(value.replace(/[$,% ]/g, ''));
      row[header] = !isNaN(numValue) && value.length > 0 ? numValue : value || null;
    });
    
    rows.push(row);
  }
  
  return { headers, rows };
}

// Extract financial assumptions from parsed data with statistical analysis
export function extractFinancialAssumptions(
  headers: string[],
  rows: Record<string, any>[],
  columnMapping: ColumnMapping
): Partial<ParsedFinancialData> {
  const result: Partial<ParsedFinancialData> = {};
  
  if (rows.length === 0) return result;

  // Calculate statistics for each mapped column
  const columnStats: Record<string, ColumnStatistics> = {};
  
  Object.entries(columnMapping).forEach(([csvColumn, fieldKey]) => {
    const columnValues = rows
      .map(row => row[csvColumn])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    
    if (columnValues.length > 0) {
      columnStats[fieldKey] = calculateColumnStats(columnValues);
    }
  });

  // Extract high-confidence values
  Object.entries(columnStats).forEach(([fieldKey, stats]) => {
    if (stats.values.length === 0 || stats.confidence < 50) return; // Skip low confidence
    
    switch (fieldKey) {
      case 'revenue':
        result.month1Revenue = Math.round(stats.average);
        break;
      case 'growthRate':
        // Use trend if available, otherwise estimate from variation
        result.monthlyGrowth = Math.max(-0.5, Math.min(0.5, stats.growth));
        break;
      case 'cogs':
        // Percentage field - use average
        result.cogsPercent = Math.min(1, Math.max(0, stats.average / 100));
        break;
      case 'opex':
        result.monthlyOpex = Math.round(stats.average);
        break;
      case 'capex':
        result.monthlyCapex = Math.round(stats.average);
        break;
      case 'taxRate':
        result.taxRate = Math.min(1, Math.max(0, stats.average / 100));
        break;
      case 'arDays':
        result.arDays = Math.round(stats.average);
        break;
      case 'apDays':
        result.apDays = Math.round(stats.average);
        break;
      case 'loanAmount':
        result.loanAmount = Math.round(stats.average);
        break;
      case 'loanRate':
        result.loanRate = Math.min(1, Math.max(0, stats.average / 100));
        break;
      case 'loanTerm':
        result.loanTerm = Math.round(stats.average);
        break;
    }
  });
  
  return result;
}

// Parse XLSX file using xlsx library
export async function parseXLSX(file: File): Promise<{ headers: string[], rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet with data
        let sheetData: any = [];
        for (const sheetName of workbook.SheetNames) {
          const ws = workbook.Sheets[sheetName];
          const parsed = XLSX.utils.sheet_to_json(ws, { 
            defval: '',
            blankrows: false 
          });
          if (parsed.length > 0) {
            sheetData = parsed;
            break; // Use first non-empty sheet
          }
        }
        
        if (sheetData.length === 0) {
          reject(new Error('No data found in Excel file'));
          return;
        }
        
        // Extract headers from first row keys
        const headers = Object.keys(sheetData[0]).map(h => h.toLowerCase().trim());
        
        // Convert data, normalize numeric values
        const rows = sheetData.map((row: any) => {
          const normalized: Record<string, any> = {};
          headers.forEach((header, idx) => {
            const originalKey = Object.keys(row)[idx] || header;
            const value = row[originalKey];
            
            // Try to convert to number if it looks numeric
            if (value !== null && value !== undefined && value !== '') {
              const numValue = parseFloat(String(value).replace(/[$,% ]/g, ''));
              normalized[header] = !isNaN(numValue) ? numValue : value;
            } else {
              normalized[header] = null;
            }
          });
          return normalized;
        });
        
        resolve({ headers, rows });
      } catch (err) {
        reject(new Error(`Failed to parse XLSX: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Main function: Parse file and extract assumptions - handles both CSV and XLSX
export async function parseFinancialFile(
  file: File
): Promise<{ assumptions: Partial<ParsedFinancialData>, confidence: number, mappedFields: string[] }> {
  let headers: string[] = [];
  let rows: Record<string, any>[] = [];
  
  // Detect file type and parse accordingly
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    // Parse XLSX
    try {
      const parsed = await parseXLSX(file);
      headers = parsed.headers;
      rows = parsed.rows;
    } catch (err) {
      throw new Error(`XLSX parsing failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    // Parse CSV
    try {
      const content = await file.text();
      const parsed = parseCSV(content);
      headers = parsed.headers;
      rows = parsed.rows;
    } catch (err) {
      throw new Error(`CSV parsing failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  if (headers.length === 0 || rows.length === 0) {
    throw new Error('No valid data extracted from file. Please check file format and content.');
  }
  
  const columnMapping = detectFinancialColumns(headers);
  const assumptions = extractFinancialAssumptions(headers, rows, columnMapping);
  
  // Calculate confidence score (0-100) - higher when more fields are mapped
  const mappedFieldCount = Object.keys(columnMapping).length;
  const confidence = mappedFieldCount > 0 ? Math.round((mappedFieldCount / headers.length) * 100) : 0;
  
  const mappedFields = Object.values(columnMapping).filter((v, i, a) => a.indexOf(v) === i); // Unique
  
  console.log('Extraction result:', {
    fileType: file.name.endsWith('.xlsx') ? 'XLSX' : 'CSV',
    headersFound: headers.length,
    rowsFound: rows.length,
    mappedFields: mappedFields.length,
    confidence,
    extractedAssumptions: Object.keys(assumptions).length,
  });
  
  return {
    assumptions,
    confidence,
    mappedFields,
  };
}
