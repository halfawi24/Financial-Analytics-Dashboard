import { NextRequest, NextResponse } from 'next/server';

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

    // Calculate totals
    const totalRevenue = monthlyData.reduce((sum: number, m: any) => sum + m.revenue, 0);
    const totalEBITDA = monthlyData.reduce((sum: number, m: any) => sum + m.ebitda, 0);
    const endingCash = monthlyData[monthlyData.length - 1]?.endingCash || 0;
    const margin = totalRevenue > 0 ? (totalEBITDA / totalRevenue * 100).toFixed(1) : '0';

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Financial Report - ${scenario.toUpperCase()} Case</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; color: #1f2937; line-height: 1.6; }
    .page { page-break-after: always; padding: 40px; }
    .header { border-bottom: 3px solid #0f766e; padding-bottom: 20px; margin-bottom: 40px; }
    .header h1 { font-size: 32px; color: #0f766e; margin-bottom: 10px; }
    .header p { color: #6b7280; font-size: 14px; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
    .metric { background: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #0f766e; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
    .section { margin-bottom: 40px; }
    .section h2 { font-size: 18px; color: #0f766e; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    thead { background: #f9fafb; }
    th { text-align: left; padding: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; font-size: 13px; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    tr:hover { background: #f9fafb; }
    .text-right { text-align: right; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Financial Analysis Report</h1>
      <p>Scenario: <strong>${scenario.toUpperCase()} CASE</strong> | Generated: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-label">12-Month Revenue</div>
        <div class="metric-value">$${(totalRevenue / 1000).toFixed(0)}K</div>
      </div>
      <div class="metric">
        <div class="metric-label">Total EBITDA</div>
        <div class="metric-value">$${(totalEBITDA / 1000).toFixed(0)}K</div>
      </div>
      <div class="metric">
        <div class="metric-label">EBITDA Margin</div>
        <div class="metric-value">${margin}%</div>
      </div>
    </div>

    <div class="section">
      <h2>Monthly Projection</h2>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th class="text-right">Revenue</th>
            <th class="text-right">COGS</th>
            <th class="text-right">OpEx</th>
            <th class="text-right">EBITDA</th>
            <th class="text-right">Ending Cash</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyData.map((m: any, idx: number) => `
            <tr>
              <td>Month ${idx + 1}</td>
              <td class="text-right">$${(m.revenue / 1000).toFixed(1)}K</td>
              <td class="text-right">$${(m.cogs / 1000).toFixed(1)}K</td>
              <td class="text-right">$${(m.opex / 1000).toFixed(1)}K</td>
              <td class="text-right">$${(m.ebitda / 1000).toFixed(1)}K</td>
              <td class="text-right">$${(m.endingCash / 1000).toFixed(1)}K</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${assumptions ? `
    <div class="section">
      <h2>Key Assumptions</h2>
      <table>
        <tbody>
          <tr><td><strong>Month 1 Revenue</strong></td><td class="text-right">$${(assumptions.month1Revenue / 1000).toFixed(1)}K</td></tr>
          <tr><td><strong>Monthly Growth</strong></td><td class="text-right">${(assumptions.monthlyGrowth * 100).toFixed(1)}%</td></tr>
          <tr><td><strong>COGS % of Revenue</strong></td><td class="text-right">${(assumptions.cogsPercent * 100).toFixed(1)}%</td></tr>
          <tr><td><strong>Monthly OpEx</strong></td><td class="text-right">$${(assumptions.monthlyOpex / 1000).toFixed(1)}K</td></tr>
          <tr><td><strong>Monthly CapEx</strong></td><td class="text-right">$${(assumptions.monthlyCapex / 1000).toFixed(1)}K</td></tr>
          <tr><td><strong>AR Days</strong></td><td class="text-right">${assumptions.arDays}</td></tr>
          <tr><td><strong>AP Days</strong></td><td class="text-right">${assumptions.apDays}</td></tr>
          <tr><td><strong>Loan Amount</strong></td><td class="text-right">$${(assumptions.loanAmount / 1000).toFixed(1)}K</td></tr>
          <tr><td><strong>Loan Rate</strong></td><td class="text-right">${(assumptions.loanRate * 100).toFixed(2)}%</td></tr>
          <tr><td><strong>Loan Term</strong></td><td class="text-right">${assumptions.loanTerm} months</td></tr>
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>FlexFinToolkit — Enterprise Financial Analytics Platform | All data calculated in real-time</p>
    </div>
  </div>
</body>
</html>
    `;

    // For PDF generation, we'll send HTML and use browser rendering on client side
    // Return the HTML which will be converted to PDF via browser API
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="financial-report-${scenario}-case.html"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
