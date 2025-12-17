/**
 * Audit Logger Integration
 * Integrates Winston JSON logging across all FIAE modules
 * Provides comprehensive audit trails for all operations
 */

import logger from './winston-logger';

export class AuditIntegration {
  static logFileProcessing(filePath: string, status: 'started' | 'completed' | 'failed', details?: any) {
    logger.info('File processing event', {
      event: 'file_processing',
      filePath,
      status,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  static logExtraction(accuracy: number, recordCount: number, fileName: string) {
    logger.info('Data extraction completed', {
      event: 'data_extraction',
      accuracy,
      recordCount,
      fileName,
      timestamp: new Date().toISOString(),
    });
  }

  static logCalculation(metricCount: number, processingTime: number) {
    logger.info('Financial calculation completed', {
      event: 'financial_calculation',
      metricCount,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    });
  }

  static logExport(format: string, fileSize: number, status: 'success' | 'failed') {
    logger.info('Export operation completed', {
      event: 'export_operation',
      format,
      fileSizeBytes: fileSize,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  static logError(errorType: string, message: string, context?: any) {
    logger.error('Error occurred during processing', {
      event: 'error_occurred',
      errorType,
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  static logValidation(passed: boolean, validationName: string, details?: any) {
    logger.info('Validation check performed', {
      event: 'validation_check',
      passed,
      validationName,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  static logApiRequest(method: string, endpoint: string, statusCode: number) {
    logger.info('API request processed', {
      event: 'api_request',
      method,
      endpoint,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  }
}

export default AuditIntegration;
