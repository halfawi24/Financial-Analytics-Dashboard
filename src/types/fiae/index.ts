/**
 * Financial Intelligence Automation Engine (FIAE)
 * Core Type Definitions
 * 
 * All types are deterministic, process-agnostic, and fully typed.
 */

// ============================================================================
// PROCESS DEFINITIONS
// ============================================================================

export type ProcessType = 
  | 'revenue_ar'      // Revenue / Accounts Receivable
  | 'ap_expense'      // AP / Expense Management
  | 'budget_actual'   // Budget vs Actual Analysis
  | 'fund_ops'        // Fund Operations & Cash Timing
  | 'mixed_ops';      // Mixed Operational Finance

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export type CashDirection = 'inflow' | 'outflow' | 'both';

export interface ProcessDefinition {
  processType: ProcessType;
  timeGranularity: TimeGranularity;
  inflowSources: string[];        // e.g., ['revenue', 'grants', 'interest']
  outflowSources: string[];       // e.g., ['payroll', 'rent', 'supplies']
  entityDimensions: string[];     // e.g., ['department', 'project', 'fund']
  assumptions: Record<string, unknown>;
  confidence: number;             // 0-100% confidence in detection
  inferenceReasoning: string;     // Why this process was detected
}

// ============================================================================
// FILE INGESTION & SCHEMA
// ============================================================================

export type FileFormat = 'xlsx' | 'csv';

export interface RawFileMetadata {
  filename: string;
  format: FileFormat;
  uploadedAt: Date;
  fileSizeBytes: number;
  sheets?: string[];              // For XLSX
  rowCount?: number;
  columnCount?: number;
}

export type ColumnSemanticType =
  | 'date'
  | 'amount'
  | 'entity'
  | 'category'
  | 'direction'              // 'inflow', 'outflow'
  | 'status'
  | 'reference'
  | 'description'
  | 'period'
  | 'unknown';

export interface ColumnInference {
  columnName: string;
  semanticType: ColumnSemanticType;
  confidence: number;            // 0-100%
  suggestedMapping?: string;
  userOverride?: ColumnSemanticType;
}

export interface SheetClassification {
  sheetName: string;
  sheetType: 'transactions' | 'master_data' | 'budget' | 'forecast' | 'assumptions' | 'unknown';
  confidence: number;
  columnInferences: ColumnInference[];
}

export interface SchemaInference {
  fileMetadata: RawFileMetadata;
  sheets: SheetClassification[];
  overallConfidence: number;
  flaggedLowConfidenceColumns: ColumnInference[];
  recommendedProcessType?: ProcessType;
}

// ============================================================================
// NORMALIZED FINANCIAL MODEL
// ============================================================================

export interface Transaction {
  id: string;
  date: Date;
  entity: string;
  amount: number;
  direction: CashDirection;       // 'inflow' or 'outflow'
  category: string;
  description: string;
  reference: string;
  isAccrual: boolean;
  status: 'posted' | 'pending' | 'scheduled';
  metadata: Record<string, unknown>;
}

export interface TimeBucket {
  period: string;                 // 'YYYY-MM' or similar
  startDate: Date;
  endDate: Date;
  transactions: Transaction[];
  netCash: number;
  inflows: number;
  outflows: number;
}

export interface EntityHierarchy {
  id: string;
  name: string;
  entityType: string;            // 'department', 'project', 'fund', etc.
  parentEntityId?: string;
  metadata: Record<string, unknown>;
}

export interface NormalizedFinancialModel {
  processDefinition: ProcessDefinition;
  entities: EntityHierarchy[];
  transactions: Transaction[];
  timeBuckets: TimeBucket[];
  calculatedMetrics: CalculatedMetrics;
  auditTrail: AuditLogEntry[];
}

// ============================================================================
// CALCULATIONS & METRICS
// ============================================================================

export interface CalculatedMetrics {
  // Cash Flow Metrics
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  endingCashBalance: number;
  
  // Period Metrics
  averageDailyBurn?: number;
  runway?: number;               // months of runway remaining
  
  // Revenue Metrics
  totalRevenue?: number;
  averageRevenuePerPeriod?: number;
  
  // Budget Metrics
  budgetVariance?: number;       // actual - budget
  budgetVariancePercent?: number;
  
  // Working Capital
  daysOfSalesOutstanding?: number;
  daysPayableOutstanding?: number;
  
  // Custom Metrics
  custom: Record<string, number>;
}

export interface ScenarioSimulation {
  scenarioName: string;
  description: string;
  parameters: Record<string, number | string>;
  projectedMetrics: CalculatedMetrics;
  assumptions: Record<string, unknown>;
}

// ============================================================================
// AUDIT & GOVERNANCE
// ============================================================================

export type AuditEventType =
  | 'file_ingested'
  | 'file_processed'
  | 'schema_inferred'
  | 'process_detected'
  | 'data_normalized'
  | 'calculations_run'
  | 'export_generated'
  | 'error_occurred'
  | 'manual_override';

export interface AuditLogEntry {
  timestamp: Date;
  eventType: AuditEventType;
  description: string;
  details: Record<string, unknown>;
  userAction?: string;
  errorMessage?: string;
}

export interface MappingReport {
  generatedAt: Date;
  lowConfidenceColumns: ColumnInference[];
  suggestedMappings: Record<string, ColumnSemanticType>;
  userOverrides: Record<string, ColumnSemanticType>;
  overallConfidence: number;
}

// ============================================================================
// EXPORT ARTIFACTS
// ============================================================================

export interface ExportRequest {
  modelId: string;
  formats: ('excel' | 'csv' | 'powerpoint' | 'json')[];
  includeAuditTrail: boolean;
  scenariosToInclude?: string[];
}

export interface ExportArtifact {
  id: string;
  format: string;
  filename: string;
  mimeType: string;
  generatedAt: Date;
  filePath: string;
  fileSize: number;
  checksum: string;               // For integrity validation
}

export interface IngestionResult {
  modelId: string;
  processDefinition: ProcessDefinition;
  schemaInference: SchemaInference;
  normalizedModel: NormalizedFinancialModel;
  exports: ExportArtifact[];
  auditLog: AuditLogEntry[];
  status: 'success' | 'success_with_warnings' | 'failed';
  warnings: string[];
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class FIAEError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FIAEError';
  }
}

export class SchemaInferenceError extends FIAEError {
  constructor(message: string, details?: unknown) {
    super('SCHEMA_INFERENCE_ERROR', message, details);
  }
}

export class ProcessInferenceError extends FIAEError {
  constructor(message: string, details?: unknown) {
    super('PROCESS_INFERENCE_ERROR', message, details);
  }
}

export class NormalizationError extends FIAEError {
  constructor(message: string, details?: unknown) {
    super('NORMALIZATION_ERROR', message, details);
  }
}

export class CalculationError extends FIAEError {
  constructor(message: string, details?: unknown) {
    super('CALCULATION_ERROR', message, details);
  }
}

export class ExportError extends FIAEError {
  constructor(message: string, details?: unknown) {
    super('EXPORT_ERROR', message, details);
  }
}
