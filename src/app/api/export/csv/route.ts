import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthlyData, scenario } = body;

    if (!monthlyData || !Array.isArray(monthlyData)) {
      return NextResponse.json(
        { error: 'Invalid monthly data' },
        { status: 400 }
      );
    }

    // Format data for CSV
    const csvData = monthlyData.map((m: any, idx: number) => ({
      Month: idx + 1,
      'Revenue ($)': m.revenue.toFixed(2),
      'COGS ($)': m.cogs.toFixed(2),
      'Gross Profit ($)': m.grossProfit.toFixed(2),
      'OpEx ($)': m.opex.toFixed(2),
      'EBITDA ($)': m.ebitda.toFixed(2),
      'CapEx ($)': m.capex.toFixed(2),
      'Net Cash Flow ($)': m.netCashFlow.toFixed(2),
      'Ending Cash ($)': m.endingCash.toFixed(2),
      'Taxes ($)': m.taxes.toFixed(2),
    }));

    const csv = Papa.unparse(csvData);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="financial-report-${scenario}-case.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    );
  }
}
