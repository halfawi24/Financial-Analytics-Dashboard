// Financial file parser service
// Automatically extracts and maps financial data from CSV/Excel files

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

// Common financial field aliases
const FINANCIAL_FIELDS: Record<string, string[]> = {
  revenue: ['revenue', 'sales', 'total revenue', 'gross sales', 'monthly revenue'],
  cogs: ['cogs', 'cost of goods sold', 'cost of sales', 'cost'],
  opex: ['opex', 'operating expenses', 'operating expense', 'operating costs', 'expenses'],
  capex: ['capex', 'capital expenditure', 'capital expenses', 'capex'],
  ebitda: ['ebitda', 'earnings before'],
  growthRate: ['growth', 'growth rate', 'monthly growth', 'growth %'],
  arDays: ['ar days', 'accounts receivable', 'ar', 'days sales outstanding'],
  apDays: ['ap days', 'accounts payable', 'ap', 'days payable outstanding'],
  loanAmount: ['loan', 'loan amount', 'debt', 'principal'],
  loanRate: ['loan rate', 'interest rate', 'rate', 'apr'],
  taxRate: ['tax rate', 'tax %', 'taxes'],
};

// Detect financial fields from column headers
export function detectFinancialColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    
    Object.entries(FINANCIAL_FIELDS).forEach(([fieldKey, aliases]) => {
      if (aliases.some(alias => normalizedHeader.includes(alias))) {
        mapping[header] = fieldKey;
      }
    });
  });
  
  return mapping;
}

// Parse CSV string into data
export function parseCSV(csvContent: string): { headers: string[], rows: Record<string, any>[] } {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 1) throw new Error('Empty CSV file');
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row: Record<string, any> = {};
    const values = lines[i].split(',').map(v => v.trim());
    
    headers.forEach((header, idx) => {
      const value = values[idx];
      // Try to parse as number
      row[header] = isNaN(Number(value)) ? value : Number(value);
    });
    
    rows.push(row);
  }
  
  return { headers, rows };
}

// Extract financial assumptions from parsed data
export function extractFinancialAssumptions(
  headers: string[],
  rows: Record<string, any>[],
  columnMapping: ColumnMapping
): Partial<ParsedFinancialData> {
  const result: Partial<ParsedFinancialData> = {};
  
  if (rows.length === 0) return result;
  
  // Get first row of data
  const firstRow = rows[0];
  
  // Map extracted columns to financial fields
  Object.entries(columnMapping).forEach(([csvColumn, fieldKey]) => {
    const value = firstRow[csvColumn];
    
    if (value !== undefined && value !== null) {
      switch (fieldKey) {
        case 'revenue':
          result.month1Revenue = Number(value);
          break;
        case 'growthRate':
          result.monthlyGrowth = Number(value) / 100; // Convert percentage to decimal
          break;
        case 'cogs':
          result.cogsPercent = Number(value) / 100;
          break;
        case 'opex':
          result.monthlyOpex = Number(value);
          break;
        case 'capex':
          result.monthlyCapex = Number(value);
          break;
        case 'taxRate':
          result.taxRate = Number(value) / 100;
          break;
        case 'arDays':
          result.arDays = Number(value);
          break;
        case 'apDays':
          result.apDays = Number(value);
          break;
        case 'loanAmount':
          result.loanAmount = Number(value);
          break;
        case 'loanRate':
          result.loanRate = Number(value) / 100;
          break;
        case 'loanTerm':
          result.loanTerm = Number(value);
          break;
      }
    }
  });
  
  return result;
}

// Main function: Parse file and extract assumptions
export async function parseFinancialFile(
  file: File
): Promise<{ assumptions: Partial<ParsedFinancialData>, confidence: number, mappedFields: string[] }> {
  const content = await file.text();
  const { headers, rows } = parseCSV(content);
  
  const columnMapping = detectFinancialColumns(headers);
  const assumptions = extractFinancialAssumptions(headers, rows, columnMapping);
  
  // Calculate confidence score (0-100)
  const mappedFieldCount = Object.keys(columnMapping).length;
  const confidence = Math.round((mappedFieldCount / headers.length) * 100);
  
  const mappedFields = Object.values(columnMapping);
  
  return {
    assumptions,
    confidence,
    mappedFields,
  };
}
