/**
 * FIAE API Route: POST /api/ingest
 * Ingest financial files and process them through the FIAE pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileParser } from '@/lib/fiae/pipeline/file-parser';
import { DataNormalizer } from '@/lib/fiae/normalization/normalizer';
import { CalculationEngine } from '@/lib/fiae/calculations/engine';
import { AuditLogger } from '@/lib/fiae/core/logger';

// Store processing status in memory (in production, use a database)
const processingStatus = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: number;
}>();

const auditLogger = new AuditLogger();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    processingStatus.set(jobId, {
      status: 'processing',
      timestamp: Date.now(),
    });

    // Process file asynchronously
    processFileAsync(file, jobId).catch((error) => {
      processingStatus.set(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    });

    return NextResponse.json({
      jobId,
      status: 'processing',
      message: 'File received. Processing started.',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    auditLogger.addEntry('error_occurred', 'API ingest failed', {}, errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function processFileAsync(file: File, jobId: string): Promise<void> {
  let tempFilePath: string | null = null;
  try {
    // Save file to temp location
    const buffer = await file.arrayBuffer();
    tempFilePath = join(tmpdir(), `fiae-${jobId}-${file.name}`);
    await writeFile(tempFilePath, Buffer.from(buffer));

    // Step 1: Parse file
    const parser = new FileParser(auditLogger);
    const parsedFile = await parser.parseFile(tempFilePath);

    // Step 2: Create basic process definition (inference simplified for API)
    const processDefinition: any = {
      processType: 'mixed_ops',
      confidence: 80,
      inflowSources: ['inflows'],
      outflowSources: ['outflows'],
      entityDimensions: ['entity'],
      timeGranularity: 'monthly',
      inferenceReasoning: 'Auto-detected from file structure',
    };

    // Step 3: Normalize data
    const normalizer = new DataNormalizer(auditLogger);
    const normalizedModel = await normalizer.normalize(parsedFile.sheets, processDefinition);

    // Step 4: Calculate metrics
    const calculationEngine = new CalculationEngine(auditLogger);
    const calculatedModel = calculationEngine.calculate(normalizedModel);

    // Store result
    processingStatus.set(jobId, {
      status: 'completed',
      result: {
        processType: processDefinition.processType,
        confidence: processDefinition.confidence,
        transactionCount: normalizedModel.transactions.length,
        timeBuckets: normalizedModel.timeBuckets.length,
        metrics: calculatedModel.calculatedMetrics,
        model: calculatedModel, // Store full model for exports
      },
      timestamp: Date.now(),
    });

    auditLogger.addEntry('file_processed', `Successfully processed ${file.name}`, {
      jobId,
      fileName: file.name,
      processType: processDefinition.processType,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    auditLogger.addEntry('error_occurred', `Failed to process file ${file.name}`, { jobId }, errorMessage);
    throw error;
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
