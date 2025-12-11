'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DataGridProps {
  data: Array<{
    month: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
    ebitda: number;
    opex: number;
    capex: number;
    netCashFlow: number;
    endingCash: number;
  }>;
}

type SortField = keyof DataGridProps['data'][0];
type SortOrder = 'asc' | 'desc';

export function DataGrid({ data }: DataGridProps) {
  const [sortField, setSortField] = useState<SortField>('month');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [data, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const columns: { key: SortField; label: string; format: (v: number) => string }[] = [
    { key: 'month', label: 'Month', format: (v) => `M${v}` },
    { key: 'revenue', label: 'Revenue', format: (v) => `$${(v / 1000).toFixed(0)}K` },
    { key: 'cogs', label: 'COGS', format: (v) => `$${(v / 1000).toFixed(0)}K` },
    { key: 'grossProfit', label: 'Gross Profit', format: (v) => `$${(v / 1000).toFixed(0)}K` },
    { key: 'ebitda', label: 'EBITDA', format: (v) => `$${(v / 1000).toFixed(0)}K` },
    { key: 'opex', label: 'OpEx', format: (v) => `$${(v / 1000).toFixed(0)}K` },
    { key: 'capex', label: 'CapEx', format: (v) => `$${(v / 1000).toFixed(0)}K` },
    { key: 'netCashFlow', label: 'Net Cash Flow', format: (v) => `$${(v / 1000).toFixed(0)}K` },
    { key: 'endingCash', label: 'Ending Cash', format: (v) => `$${(v / 1000).toFixed(0)}K` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-auto"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-4">12-Month Financial Data</h3>
      
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className="px-4 py-3 text-left font-semibold text-slate-700 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {sortField === col.key && (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4 text-teal-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-teal-600" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <motion.tr
              key={row.month}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.01 }}
              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {columns.map(col => (
                <td key={`${row.month}-${col.key}`} className="px-4 py-3 text-slate-900">
                  {col.format(row[col.key])}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
