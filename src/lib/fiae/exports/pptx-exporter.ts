/**
 * FIAE PowerPoint Exporter
 * Generates professional executive presentations
 * Using PptxGenJS v4.x API
 */

import PptxGenJS from 'pptxgenjs';
import { NormalizedFinancialModel } from '@/types/fiae';
import * as fs from 'fs';
import { AuditLogger } from '@/lib/fiae/core/logger';

export class PowerPointExporter {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  async export(model: NormalizedFinancialModel, outputPath: string): Promise<string> {
    try {
      const pres = new PptxGenJS();
      const brandColor = '#0F766E';
      const textColor = '#1F2937';
      
      // Slide 1: Title Slide with Professional Design
      {
        const slide = pres.addSlide();
        slide.background = { color: '#FFFFFF' };
        
        // Left accent bar
        slide.addShape('rect', {
          x: 0,
          y: 0,
          w: 0.3,
          h: 7.5,
          fill: { color: brandColor },
        });
        
        // Main title
        slide.addText('Financial Intelligence', {
          x: 0.8,
          y: 1.5,
          w: 8,
          h: 1.0,
          fontSize: 54,
          bold: true,
          color: brandColor,
          align: 'left',
        });
        
        slide.addText('Automation Engine', {
          x: 0.8,
          y: 2.6,
          w: 8,
          h: 0.8,
          fontSize: 44,
          color: '#6B7280',
          align: 'left',
        });
        
        // Divider
        slide.addShape('line', {
          x: 0.8,
          y: 3.6,
          w: 4,
          h: 0,
          line: { color: brandColor, width: 3 },
        } as any);
        
        // Report info
        slide.addText('Financial Report', {
          x: 0.8,
          y: 4.2,
          w: 8,
          h: 0.5,
          fontSize: 18,
          color: '#374151',
        });
        
        slide.addText(`Generated: ${new Date().toLocaleDateString()}`, {
          x: 0.8,
          y: 5.0,
          w: 8,
          h: 0.4,
          fontSize: 14,
          color: '#9CA3AF',
        });
        
        slide.addText(`Analysis Date: ${new Date().toISOString().split('T')[0]}`, {
          x: 0.8,
          y: 5.6,
          w: 8,
          h: 0.4,
          fontSize: 14,
          color: '#9CA3AF',
        });
      }

      // Slide 2: Executive Summary
      {
        const slide = pres.addSlide();
        this.addHeader(slide, 'Executive Summary', brandColor);
        const metrics = model.calculatedMetrics;
        
        const summaryItems = [
          { label: 'Total Inflows', value: `$${(metrics.totalInflows / 1000).toFixed(1)}K` },
          { label: 'Total Outflows', value: `$${(metrics.totalOutflows / 1000).toFixed(1)}K` },
          { label: 'Net Cash Flow', value: `$${(metrics.netCashFlow / 1000).toFixed(1)}K` },
          { label: 'Runway', value: `${metrics.runway?.toFixed(1) || 'N/A'} months` },
        ];

        let y = 1.5;
        summaryItems.forEach(item => {
          slide.addText(item.label, {
            x: 0.5,
            y,
            w: 4,
            h: 0.4,
            fontSize: 14,
            color: textColor,
          });
          slide.addText(item.value, {
            x: 4.5,
            y,
            w: 5,
            h: 0.4,
            fontSize: 16,
            bold: true,
            color: brandColor,
          });
          y += 0.8;
        });
      }

      // Slide 3: Process Overview
      {
        const slide = pres.addSlide();
        this.addHeader(slide, 'Process Overview', brandColor);
        
        const items = [
          `Process Type: ${model.processDefinition.processType}`,
          `Inflow Sources: ${model.processDefinition.inflowSources?.join(', ') || 'N/A'}`,
          `Outflow Sources: ${model.processDefinition.outflowSources?.join(', ') || 'N/A'}`,
          `Time Periods: ${model.timeBuckets.length}`,
          `Total Transactions: ${model.transactions.length}`,
        ];

        let y = 1.5;
        items.forEach(item => {
          slide.addText(item, {
            x: 0.7,
            y,
            w: 8.6,
            h: 0.5,
            fontSize: 14,
            color: textColor,
          });
          y += 0.7;
        });
      }

      // Slide 4: Financial Health Assessment
      {
        const slide = pres.addSlide();
        this.addHeader(slide, 'Financial Health', brandColor);
        
        const metrics = model.calculatedMetrics;
        const runway = metrics.runway || 0;
        const health = runway > 12 ? 'Strong' : runway > 6 ? 'Moderate' : 'Critical';
        const healthColor = runway > 12 ? '#10B981' : runway > 6 ? '#F59E0B' : '#EF4444';
        
        slide.addText('Liquidity Status: ' + health, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 0.6,
          fontSize: 24,
          bold: true,
          color: healthColor,
        });

        slide.addText(`Runway: ${runway.toFixed(1)} months`, {
          x: 0.5,
          y: 2.5,
          w: 9,
          h: 0.5,
          fontSize: 18,
          color: brandColor,
        });

        slide.addText(`Avg Daily Burn: $${(metrics.averageDailyBurn ? metrics.averageDailyBurn / 1000 : 0).toFixed(1)}K`, {
          x: 0.5,
          y: 3.2,
          w: 9,
          h: 0.5,
          fontSize: 16,
          color: textColor,
        });
      }

      // Slide 5: Key Metrics
      {
        const slide = pres.addSlide();
        this.addHeader(slide, 'Key Performance Indicators', brandColor);
        
        const metrics = model.calculatedMetrics;
        const metricsData: Array<Array<string | number>> = [
          ['Metric', 'Value'],
          ['Days Sales Outstanding (DSO)', metrics.daysOfSalesOutstanding ? `${metrics.daysOfSalesOutstanding.toFixed(1)} days` : 'N/A'],
          ['Days Payable Outstanding (DPO)', metrics.daysPayableOutstanding ? `${metrics.daysPayableOutstanding.toFixed(1)} days` : 'N/A'],
          ['Average Daily Burn', `$${(metrics.averageDailyBurn ? metrics.averageDailyBurn / 1000 : 0).toFixed(1)}K`],
          ['Budget Variance %', metrics.budgetVariancePercent ? `${metrics.budgetVariancePercent.toFixed(1)}%` : 'N/A'],
        ];

        slide.addTable(metricsData as any, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4.5,
          colW: [5, 4],
          border: { pt: 1, color: 'CCCCCC' },
          fill: { color: 'F3F4F6' },
          fontSize: 12,
          rowH: 0.8,
        });
      }

      // Slide 6: Time Series Analysis
      {
        const slide = pres.addSlide();
        this.addHeader(slide, 'Cash Flow Analysis', brandColor);
        
        const recentBuckets = model.timeBuckets.slice(-6);
        const periodData: Array<Array<string | number>> = [
          ['Period', 'Inflows', 'Outflows', 'Net'],
          ...recentBuckets.map(b => [
            b.period,
            `$${(b.inflows / 1000).toFixed(0)}K`,
            `$${(b.outflows / 1000).toFixed(0)}K`,
            `$${((b.inflows - b.outflows) / 1000).toFixed(0)}K`,
          ]),
        ];

        slide.addTable(periodData as any, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4.0,
          colW: [2.5, 2, 2, 2.5],
          border: { pt: 1, color: 'CCCCCC' },
          fill: { color: 'F3F4F6' },
          fontSize: 11,
          rowH: 0.6,
        });
      }

      // Slide 7: Recommendations
      {
        const slide = pres.addSlide();
        this.addHeader(slide, 'Recommendations', brandColor);

        const recommendations = [
          'Monitor cash flow trends weekly',
          'Align revenue and expense forecasts',
          'Review process efficiency metrics',
          'Validate external assumptions',
          'Track key financial indicators',
        ];

        let y = 1.5;
        recommendations.forEach(rec => {
          slide.addText(`• ${rec}`, {
            x: 0.7,
            y,
            w: 8.6,
            h: 0.5,
            fontSize: 13,
            color: textColor,
          });
          y += 0.7;
        });
      }

      // Slide 8: Appendix
      {
        const slide = pres.addSlide();
        this.addHeader(slide, 'Appendix: Processing Assumptions', brandColor);
        
        const assumptions = [
          `Process Type: ${model.processDefinition.processType}`,
          `Confidence Level: ${model.processDefinition.confidence}%`,
          `Time Periods: ${model.timeBuckets.length}`,
          `Transactions: ${model.transactions.length}`,
          `Analysis Date: ${new Date().toISOString().split('T')[0]}`,
        ];

        let y = 1.5;
        assumptions.forEach(assumption => {
          slide.addText(assumption, {
            x: 0.7,
            y,
            w: 8.6,
            h: 0.4,
            fontSize: 12,
            color: textColor,
          });
          y += 0.6;
        });
      }

      // Save using correct PptxGenJS v4 API
      // The writeFile method in v4 accepts string path directly
      return new Promise((resolve, reject) => {
        try {
          // For PptxGenJS v4.x, we need to use the callback-based approach
          pres.writeFile({
            fileName: outputPath,
          } as any).then(() => {
            const fileSize = fs.statSync(outputPath).size;
            this.auditLogger.addEntry('export_generated', `PowerPoint export created: ${outputPath}`, {
              outputPath,
              fileSize,
              slideCount: 8,
            });
            resolve(outputPath);
          }).catch((error: Error) => {
            this.auditLogger.addEntry(
              'error_occurred',
              'PowerPoint export failed',
              { outputPath },
              error.message
            );
            reject(error);
          });
        } catch (error) {
          this.auditLogger.addEntry(
            'error_occurred',
            'PowerPoint export initialization failed',
            { outputPath },
            error instanceof Error ? error.message : String(error)
          );
          reject(error);
        }
      });
    } catch (error) {
      this.auditLogger.addEntry(
        'error_occurred',
        'PowerPoint export failed',
        { outputPath },
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private addHeader(slide: any, title: string, color: string): void {
    // Background bar
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: 10,
      h: 1.0,
      fill: { color: '#F8FAFC' },
    });
    
    slide.addText(title, {
      x: 0.5,
      y: 0.25,
      w: 9,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color,
    });
    
    // Bottom accent line
    slide.addShape('line', {
      x: 0.5,
      y: 0.95,
      w: 9,
      h: 0,
      line: { color, width: 4 },
    } as any);
  }

  private addKPICard(slide: any, x: number, y: number, label: string, value: string, color: string): void {
    // Card background
    slide.addShape('rect', {
      x,
      y,
      w: 2.2,
      h: 1.2,
      fill: { color: '#FFFFFF' },
      line: { color: '#E5E7EB', width: 1 },
    });

    // Color accent bar (top)
    slide.addShape('rect', {
      x,
      y,
      w: 2.2,
      h: 0.12,
      fill: { color },
    });

    // Label
    slide.addText(label, {
      x: x + 0.15,
      y: y + 0.2,
      w: 1.9,
      h: 0.35,
      fontSize: 10,
      color: '#6B7280',
      bold: true,
    });

    // Value
    slide.addText(value, {
      x: x + 0.15,
      y: y + 0.65,
      w: 1.9,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color,
    });
  }

  private addMetricsRow(slide: any, y: number, label: string, value: string, bgColor: string = '#FFFFFF'): void {
    slide.addShape('rect', {
      x: 0.5,
      y,
      w: 9,
      h: 0.5,
      fill: { color: bgColor },
      line: { color: '#E5E7EB', width: 0.5 },
    });

    slide.addText(label, {
      x: 0.7,
      y: y + 0.05,
      w: 5.5,
      h: 0.4,
      fontSize: 12,
      color: '#374151',
    });

    slide.addText(value, {
      x: 6.2,
      y: y + 0.05,
      w: 3,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: '#0F766E',
      align: 'right',
    });
  }
}
