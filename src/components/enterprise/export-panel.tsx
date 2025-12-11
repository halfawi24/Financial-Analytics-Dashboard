'use client';

import { motion } from 'framer-motion';
import { Download, FileJson, FileText, Sheet } from 'lucide-react';
import { useState } from 'react';
import { exportToCSV, exportToXLSX, exportToPDF } from '@/lib/export-utils';
import type { FinancialAssumptions, MonthlyMetrics } from '@/lib/financial-engine';

interface ExportPanelProps {
  scenario: 'base' | 'best' | 'worst';
  monthlyData?: MonthlyMetrics[];
  assumptions?: FinancialAssumptions;
}

export function ExportPanel({ scenario, monthlyData = [], assumptions }: ExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    if (!monthlyData || monthlyData.length === 0) {
      setError('No data available to export');
      return;
    }

    setExporting(format);
    setError(null);

    try {
      switch (format) {
        case 'csv':
          await exportToCSV(monthlyData, scenario);
          break;
        case 'xlsx':
          await exportToXLSX(monthlyData, scenario, assumptions);
          break;
        case 'pdf':
          await exportToPDF(monthlyData, scenario, assumptions);
          break;
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'pdf',
      label: 'PDF Report',
      icon: FileText,
      description: 'Professional PDF with charts and tables',
      color: 'text-red-600 bg-red-50',
    },
    {
      id: 'csv',
      label: 'CSV Data',
      icon: FileJson,
      description: 'Raw data for spreadsheet analysis',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'xlsx',
      label: 'Excel Workbook',
      icon: Sheet,
      description: 'Formatted Excel with formulas',
      color: 'text-green-600 bg-green-50',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-teal-600" />
        Export Report
      </h3>

      <p className="text-sm text-slate-600 mb-6">
        Export {scenario.toUpperCase()} case analysis in your preferred format
      </p>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-900">⚠️ {error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportOptions.map(option => {
          const Icon = option.icon;
          const isExporting = exporting === option.id;

          return (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport(option.id as any)}
              disabled={isExporting}
              className={`p-4 rounded-lg border-2 border-slate-200 hover:border-teal-300 transition-all text-left ${option.color}`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="h-6 w-6" />
                {isExporting && (
                  <div className="animate-spin">
                    <Download className="h-4 w-4" />
                  </div>
                )}
              </div>
              <p className="font-semibold text-slate-900">{option.label}</p>
              <p className="text-xs text-slate-600 mt-1">{option.description}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-teal-50 rounded-lg">
        <p className="text-xs text-teal-900">
          💡 <strong>Pro Tip:</strong> Export reports regularly to track analysis history and compare scenarios over time.
        </p>
      </div>
    </motion.div>
  );
}
