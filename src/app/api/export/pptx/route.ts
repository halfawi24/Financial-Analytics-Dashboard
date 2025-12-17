/**
 * FIAE API Route: POST /api/export/pptx
 * Generate PowerPoint presentations from financial data
 */

import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { monthlyData, scenario, assumptions } = body;

    if (!monthlyData || !Array.isArray(monthlyData)) {
      return NextResponse.json(
        { error: 'Invalid monthly data' },
        { status: 400 }
      );
    }

    // Create presentation
    const pres = new PptxGenJS();
    const brandColor = '#0F766E';
    const accentColor = '#10B981';

    // Slide 1: Title
    {
      const slide = pres.addSlide();
      slide.background = { color: brandColor };
      slide.addText('Financial Analysis Report', {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1.5,
        fontSize: 54,
        bold: true,
        color: '#FFFFFF',
        align: 'center',
      });
      slide.addText(`${scenario.toUpperCase()} CASE SCENARIO`, {
        x: 0.5,
        y: 4.2,
        w: 9,
        h: 0.6,
        fontSize: 24,
        color: '#E0F2F1',
        align: 'center',
      });
      slide.addText(new Date().toLocaleDateString(), {
        x: 0.5,
        y: 5.2,
        w: 9,
        h: 0.5,
        fontSize: 14,
        color: '#B2DFDB',
        align: 'center',
      });
    }

    // Slide 2: Key Metrics
    {
      const slide = pres.addSlide();
      slide.background = { color: '#F8FAFC' };

      slide.addText('Executive Summary', {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.5,
        fontSize: 32,
        bold: true,
        color: brandColor,
      });

      const totalRevenue = monthlyData.reduce((sum: number, m: any) => sum + m.revenue, 0);
      const totalEBITDA = monthlyData.reduce((sum: number, m: any) => sum + m.ebitda, 0);
      const endingCash = monthlyData[monthlyData.length - 1]?.endingCash || 0;
      const margin = totalRevenue > 0 ? ((totalEBITDA / totalRevenue) * 100).toFixed(1) : '0';

      const metrics = [
        { label: '12M Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K` },
        { label: 'Total EBITDA', value: `$${(totalEBITDA / 1000).toFixed(0)}K` },
        { label: 'EBITDA Margin', value: `${margin}%` },
        { label: 'Ending Cash', value: `$${(endingCash / 1000).toFixed(0)}K` },
      ];

      metrics.forEach((metric, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 0.5 + col * 4.75;
        const y = 1.2 + row * 1.8;

        slide.addShape(pres.ShapeType.rect, {
          x,
          y,
          w: 4.5,
          h: 1.6,
          fill: { color: '#FFFFFF' },
          line: { color: accentColor, width: 2 },
        });

        slide.addText(metric.label, {
          x,
          y: y + 0.2,
          w: 4.5,
          h: 0.4,
          fontSize: 12,
          color: '#64748B',
          align: 'center',
        });

        slide.addText(metric.value, {
          x,
          y: y + 0.7,
          w: 4.5,
          h: 0.6,
          fontSize: 24,
          bold: true,
          color: brandColor,
          align: 'center',
        });
      });
    }

    // Slide 3: Monthly Progression
    {
      const slide = pres.addSlide();
      slide.background = { color: '#F8FAFC' };

      slide.addText('Monthly Projection', {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.5,
        fontSize: 32,
        bold: true,
        color: brandColor,
      });

      const tableData = [
        [
          { text: 'Month', options: { bold: true, color: '#FFFFFF' } },
          { text: 'Revenue', options: { bold: true, color: '#FFFFFF' } },
          { text: 'EBITDA', options: { bold: true, color: '#FFFFFF' } },
          { text: 'Ending Cash', options: { bold: true, color: '#FFFFFF' } },
        ],
        ...monthlyData.slice(0, 12).map((m: any, idx: number) => [
          { text: `M${idx + 1}` },
          { text: `$${(m.revenue / 1000).toFixed(0)}K` },
          { text: `$${(m.ebitda / 1000).toFixed(0)}K` },
          { text: `$${(m.endingCash / 1000).toFixed(0)}K` },
        ]),
      ] as any;

      slide.addTable(tableData, {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 4.5,
        colW: [1.5, 2.5, 2.5, 2.5],
        border: { pt: 1, color: '#E2E8F0' },
        fill: { color: '#F8FAFC' },
        align: 'center',
        fontSize: 11,
      });
    }

    // Slide 4: Assumptions
    if (assumptions) {
      const slide = pres.addSlide();
      slide.background = { color: '#F8FAFC' };

      slide.addText('Key Assumptions', {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.5,
        fontSize: 32,
        bold: true,
        color: brandColor,
      });

      const assumptionsData = [
        [
          { text: 'Assumption', options: { bold: true, color: '#FFFFFF' } },
          { text: 'Value', options: { bold: true, color: '#FFFFFF' } },
        ],
        [{ text: 'Month 1 Revenue' }, { text: `$${(assumptions.month1Revenue / 1000).toFixed(1)}K` }],
        [{ text: 'Monthly Growth' }, { text: `${(assumptions.monthlyGrowth * 100).toFixed(1)}%` }],
        [{ text: 'COGS % of Revenue' }, { text: `${(assumptions.cogsPercent * 100).toFixed(1)}%` }],
        [{ text: 'Monthly OpEx' }, { text: `$${(assumptions.monthlyOpex / 1000).toFixed(1)}K` }],
        [{ text: 'AR Days' }, { text: `${assumptions.arDays}` }],
        [{ text: 'AP Days' }, { text: `${assumptions.apDays}` }],
        [{ text: 'Loan Amount' }, { text: `$${(assumptions.loanAmount / 1000).toFixed(1)}K` }],
        [{ text: 'Loan Rate' }, { text: `${(assumptions.loanRate * 100).toFixed(2)}%` }],
      ] as any;

      slide.addTable(assumptionsData, {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 4.5,
        colW: [4.5, 4.5],
        border: { pt: 1, color: '#E2E8F0' },
        fill: { color: '#F8FAFC' },
        align: 'center',
        fontSize: 11,
      });
    }

    // Generate PPTX buffer
    const buffer = await pres.write({ outputType: 'arraybuffer' }) as ArrayBuffer;

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="financial-report-${scenario}-case.pptx"`,
      },
    });
  } catch (error) {
    console.error('PPTX export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PowerPoint presentation' },
      { status: 500 }
    );
  }
}
