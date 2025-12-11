import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthlyData, scenario, assumptions } = body;

    if (!monthlyData || !Array.isArray(monthlyData)) {
      return NextResponse.json(
        { error: 'Invalid monthly data' },
        { status: 400 }
      );
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Monthly Data
    const monthlySheet = monthlyData.map((m: any, idx: number) => ({
      'Month': idx + 1,
      'Revenue ($)': m.revenue,
      'COGS ($)': m.cogs,
      'Gross Profit ($)': m.grossProfit,
      'OpEx ($)': m.opex,
      'EBITDA ($)': m.ebitda,
      'CapEx ($)': m.capex,
      'Net Cash Flow ($)': m.netCashFlow,
      'Ending Cash ($)': m.endingCash,
      'Taxes ($)': m.taxes,
    }));

    const ws1 = XLSX.utils.json_to_sheet(monthlySheet);
    XLSX.utils.book_append_sheet(wb, ws1, 'Monthly Metrics');

    // Sheet 2: Assumptions
    if (assumptions) {
      const assumptionsSheet = [
        { Category: 'Revenue', Item: 'Month 1 Revenue', Value: assumptions.month1Revenue },
        { Category: 'Revenue', Item: 'Monthly Growth Rate', Value: (assumptions.monthlyGrowth * 100).toFixed(2) + '%' },
        { Category: 'Costs', Item: 'COGS % of Revenue', Value: (assumptions.cogsPercent * 100).toFixed(2) + '%' },
        { Category: 'Costs', Item: 'Monthly OpEx', Value: assumptions.monthlyOpex },
        { Category: 'Costs', Item: 'Monthly CapEx', Value: assumptions.monthlyCapex },
        { Category: 'Working Capital', Item: 'AR Days', Value: assumptions.arDays },
        { Category: 'Working Capital', Item: 'AP Days', Value: assumptions.apDays },
        { Category: 'Debt', Item: 'Loan Amount', Value: assumptions.loanAmount },
        { Category: 'Debt', Item: 'Loan Rate', Value: (assumptions.loanRate * 100).toFixed(2) + '%' },
        { Category: 'Debt', Item: 'Loan Term (months)', Value: assumptions.loanTerm },
      ];

      const ws2 = XLSX.utils.json_to_sheet(assumptionsSheet);
      XLSX.utils.book_append_sheet(wb, ws2, 'Assumptions');
    }

    // Generate binary
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="financial-report-${scenario}-case.xlsx"`,
      },
    });
  } catch (error) {
    console.error('XLSX export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate XLSX' },
      { status: 500 }
    );
  }
}
