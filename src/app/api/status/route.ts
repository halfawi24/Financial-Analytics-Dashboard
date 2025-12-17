/**
 * FIAE API Route: GET /api/status
 * Get processing status for a specific job ID
 */

import { NextRequest, NextResponse } from 'next/server';

// In production, this would be stored in a database
// For now, we'll use a simple in-memory store
const processingStatusStore = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: number;
}>();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    const status = processingStatusStore.get(jobId);

    if (!status) {
      return NextResponse.json(
        { error: 'Job not found', jobId },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId,
      status: status.status,
      result: status.result,
      error: status.error,
      timestamp: status.timestamp,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
