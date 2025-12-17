/**
 * FIAE - Financial Intelligence Automation Engine
 * Core module orchestration
 */

export { logger, AuditLogger, createAuditLogger } from './core/logger';
export { Validator, validator } from './core/validator';
export { FileParser, createFileParser } from './pipeline/file-parser';
export type { ParsedSheet, ParsedFile } from './pipeline/file-parser';
export { ProcessInferenceEngine, createProcessInferenceEngine } from './pipeline/process-inference';
export { DataNormalizer, createNormalizer } from './normalization/normalizer';
export { CalculationEngine, createCalculationEngine } from './calculations/engine';
export type { VarianceAnalysis } from './calculations/engine';

// Type re-exports for convenience
export type {
  ProcessDefinition,
  ProcessType,
  TimeGranularity,
  SchemaInference,
  NormalizedFinancialModel,
  CalculatedMetrics,
  ScenarioSimulation,
  Transaction,
  TimeBucket,
  IngestionResult,
  AuditLogEntry,
} from '@/types/fiae';
