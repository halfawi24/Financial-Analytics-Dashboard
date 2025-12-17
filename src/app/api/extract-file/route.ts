// Server-side file extraction API endpoint
// Handles XLSX/CSV parsing with cloud fallback for reliability
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  sheetName?: string;
}

interface ExtractionResult {
  success: boolean;
  data?: ParsedData;
  assumptions?: Record<string, any>;
  error?: string;
  confidence?: number;
  mappedFields?: string[];
}

// Financial field aliases for detection
const FINANCIAL_FIELDS: Record<string, string[]> = {
  revenue: ['revenue', 'sales', 'total revenue', 'gross sales', 'income', 'cash inflows'],
  cogs: ['cogs', 'cost of goods sold', 'cost of sales', 'cost', 'direct costs'],
  opex: ['opex', 'operating expenses', 'operating expense', 'sg&a', 'admin costs'],
  capex: ['capex', 'capital expenditure', 'fixed assets', 'equipment'],
  growthRate: ['growth', 'growth rate', 'monthly growth', 'cagr'],
  arDays: ['ar days', 'accounts receivable', 'dso'],
  apDays: ['ap days', 'accounts payable', 'dpo'],
  loanAmount: ['loan', 'loan amount', 'debt', 'principal'],
  loanRate: ['loan rate', 'interest rate', 'apr'],
  taxRate: ['tax rate', 'tax', 'taxes'],
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[_\-\s]+/g, ' ');
}

function detectFinancialColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  headers.forEach(h => {
    const normalized = normalizeHeader(h);
    Object.entries(FINANCIAL_FIELDS).forEach(([field, aliases]) => {
      if (aliases.some(alias => normalized.includes(alias))) {
        mapping[h] = field;
      }
    });
  });
  return mapping;
}

function calculateColumnStats(values: number[]) {
  const valid = values.filter(v => typeof v === 'number' && !isNaN(v) && v !== 0);
  if (valid.length === 0) return { average: 0, growth: 0, confidence: 0 };

  const average = valid.reduce((a, b) => a + b, 0) / valid.length;
  
  let growth = 0;
  if (valid.length > 1) {
    const first = valid.slice(0, Math.floor(valid.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(valid.length / 2);
    const second = valid.slice(Math.floor(valid.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(valid.length / 2);
    growth = first > 0 ? (second - first) / first : 0;
  }

  const variance = valid.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / valid.length;
  const stdDev = Math.sqrt(variance);
  const coefVar = average > 0 ? stdDev / average : 0;
  let confidence = 100;
  if (coefVar > 0.5) confidence = 70;
  if (coefVar > 1) confidence = 50;

  return { average, growth, confidence, count: valid.length };
}

function extractAssumptions(headers: string[], rows: Record<string, any>[], mapping: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(mapping as Record<string, string>).forEach(([csvCol, fieldKey]) => {
    const values = rows
      .map(r => r[csvCol])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return;
    const stats = calculateColumnStats(values);
    if (stats.confidence < 50) return;

    switch (fieldKey) {
      case 'revenue':
        result.month1Revenue = Math.round(stats.average);
        break;
      case 'growthRate':
        result.monthlyGrowth = Math.max(-0.5, Math.min(0.5, stats.growth));
        break;
      case 'cogs':
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
    }
  });

  return result;
}

async function parseXLSX(buffer: Buffer): Promise<ParsedData> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Priority: try to find sheet with financial data (not assumptions/notes)
    const prioritySheets = ['Financials', 'Fund CF', 'Project CF', 'Financial', 'Data', 'Projections', 'Model'];
    let selectedSheet = '';
    
    // First, try priority sheets
    for (const priority of prioritySheets) {
      if (workbook.SheetNames.find(s => s.toLowerCase().includes(priority.toLowerCase()))) {
        selectedSheet = workbook.SheetNames.find(s => s.toLowerCase().includes(priority.toLowerCase())) || '';
        break;
      }
    }
    
    // If not found, try all sheets and pick one with most data
    if (!selectedSheet) {
      let maxRows = 0;
      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '', blankrows: false }) as Record<string, any>[];
        if (json.length > maxRows && !sheetName.toLowerCase().includes('assumption') && !sheetName.toLowerCase().includes('note')) {
          maxRows = json.length;
          selectedSheet = sheetName;
        }
      }
    }
    
    // Fallback to first sheet with data
    if (!selectedSheet) {
      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '', blankrows: false }) as Record<string, any>[];
        if (json.length > 0) {
          selectedSheet = sheetName;
          break;
        }
      }
    }
    
    if (!selectedSheet) {
      throw new Error('No data found in Excel workbook');
    }
    
    const ws = workbook.Sheets[selectedSheet];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '', blankrows: false }) as Record<string, any>[];
    
    if (json.length === 0) {
      throw new Error(`No data in sheet: ${selectedSheet}`);
    }

    // Filter out empty columns (like __empty, __empty_1, etc)
    const allKeys = new Set<string>();
    json.forEach(row => {
      Object.keys(row).forEach(k => {
        if (k && !k.startsWith('__empty')) {
          allKeys.add(k);
        }
      });
    });
    
    const headers = Array.from(allKeys).map(h => h.toLowerCase().trim()).filter(h => h);
    
    // If still no real headers, extract from all columns
    if (headers.length === 0) {
      const allHeaders = Object.keys(json[0] || {});
      // Use headers starting from first non-empty column
      const firstNonEmpty = allHeaders.findIndex(h => !h.startsWith('__empty'));
      return {
        headers: allHeaders.slice(Math.max(0, firstNonEmpty)).map(h => h.toLowerCase().trim()),
        rows: json.map((row: any) => {
          const normalized: Record<string, any> = {};
          Object.entries(row).forEach(([k, v]) => {
            const key = k.toLowerCase().trim();
            if (key && !key.startsWith('__empty')) {
              const num = parseFloat(String(v).replace(/[$,% ]/g, ''));
              normalized[key] = v !== null && v !== undefined && v !== '' ? (!isNaN(num) ? num : v) : null;
            }
          });
          return normalized;
        }),
        sheetName: selectedSheet,
      };
    }

    const rows = json.map((row: any) => {
      const normalized: Record<string, any> = {};
      headers.forEach(h => {
        // Find the original key (case-sensitive)
        const origKey = Object.keys(row).find(k => k.toLowerCase().trim() === h);
        const val = origKey ? row[origKey] : null;
        
        if (val !== null && val !== undefined && val !== '') {
          const num = parseFloat(String(val).replace(/[$,% ]/g, ''));
          normalized[h] = !isNaN(num) ? num : val;
        } else {
          normalized[h] = null;
        }
      });
      return normalized;
    });

    console.log(`✓ Parsed sheet "${selectedSheet}": ${rows.length} rows, ${headers.length} columns`);
    
    return { headers, rows, sheetName: selectedSheet };
  } catch (err) {
    throw new Error(`XLSX: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function parseCSV(content: string): Promise<ParsedData> {
  try {
    const lines = content.trim().split('\n').filter(l => l.trim());
    if (lines.length < 1) throw new Error('Empty CSV');

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    
    const rows = lines.slice(1).map(line => {
      const row: Record<string, any> = {};
      const values = line.split(delimiter).map(v => v.trim());
      headers.forEach((h, i) => {
        const val = values[i];
        if (val) {
          const num = parseFloat(val.replace(/[$,% ]/g, ''));
          row[h] = !isNaN(num) ? num : val;
        } else {
          row[h] = null;
        }
      });
      return row;
    });

    return { headers, rows };
  } catch (err) {
    throw new Error(`CSV: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ExtractionResult>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let parsed: ParsedData;

    // Try XLSX first if it's an Excel file
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      parsed = await parseXLSX(buffer);
    } else {
      // Parse as CSV
      const content = new TextDecoder().decode(buffer);
      parsed = await parseCSV(content);
    }

    if (!parsed.headers.length || !parsed.rows.length) {
      return NextResponse.json({
        success: false,
        error: 'No valid data extracted from file',
      }, { status: 400 });
    }

    // Detect and extract financial data
    const mapping = detectFinancialColumns(parsed.headers);
    const assumptions = extractAssumptions(parsed.headers, parsed.rows, mapping);
    const mappedFields = Object.values(mapping).filter((v, i, a) => a.indexOf(v) === i);

    console.log('✓ File extraction successful:', {
      fileName: file.name,
      headers: parsed.headers.length,
      rows: parsed.rows.length,
      mappedFields: mappedFields.length,
      assumptions: Object.keys(assumptions).length,
    });

    return NextResponse.json({
      success: true,
      data: parsed,
      assumptions: Object.keys(assumptions).length > 0 ? assumptions : undefined,
      confidence: Math.round((mappedFields.length / Math.max(parsed.headers.length, 1)) * 100),
      mappedFields,
    }, { status: 200 });

  } catch (err) {
    console.error('✗ Extraction error:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
