/**
 * FIAE API Route: GET /api/exports
 * Export processed financial data in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { ExcelExporter } from '@/lib/fiae/exports/excel-exporter';
import { CSVExporter } from '@/lib/fiae/exports/csv-exporter';
import { PowerPointExporter } from '@/lib/fiae/exports/pptx-exporter';
import { AuditLogger } from '@/lib/fiae/core/logger';
import type { NormalizedFinancialModel } from '@/types/fiae';

const auditLogger = new AuditLogger();

// In production, replace with database lookup
const processedModelsStore = new Map<string, NormalizedFinancialModel>();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const format = searchParams.get('format') || 'excel';

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    const model = processedModelsStore.get(jobId);
    if (!model) {
      return NextResponse.json(
        { error: 'Processed data not found for job', jobId },
        { status: 404 }
      );
    }

    const validFormats = ['excel', 'csv', 'pptx'];
    if (!validFormats.includes(format.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid format. Valid options: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate export
    const fileName = `fiae-export-${jobId}.${format === 'pptx' ? 'pptx' : format === 'csv' ? 'csv' : 'xlsx'}`;
    const tempPath = join(tmpdir(), fileName);

    try {
      if (format.toLowerCase() === 'excel') {
        const exporter = new ExcelExporter(auditLogger);
        await exporter.export(model, tempPath);
      } else if (format.toLowerCase() === 'csv') {
        const exporter = new CSVExporter(auditLogger);
        await exporter.export(model, tempPath);
      } else if (format.toLowerCase() === 'pptx') {
        const exporter = new PowerPointExporter(auditLogger);
        await exporter.export(model, tempPath);
      }

      // Read and return file
      const { readFile } = await import('fs/promises');
      const fileBuffer = await readFile(tempPath);

      // Set appropriate content type
      const contentTypes: Record<string, string> = {
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        csv: 'text/csv',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };

      const response = new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentTypes[format.toLowerCase()],
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });

      // Clean up temp file
      await unlink(tempPath).catch(() => {});

      auditLogger.addEntry('export_generated', `Delivered ${format} export`, {
        jobId,
        format,
        fileName,
      });

      return response;
    } catch (error) {
      await unlink(tempPath).catch(() => {});
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    auditLogger.addEntry('error_occurred', 'Export API failed', {}, errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Export store reference for use by ingest route
export function storeProcessedModel(jobId: string, model: NormalizedFinancialModel): void {
  processedModelsStore.set(jobId, model);
}
