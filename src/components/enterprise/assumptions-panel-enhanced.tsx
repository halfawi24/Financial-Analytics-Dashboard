'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { FinancialAssumptions } from '@/lib/financial-engine';

interface AssumptionsPanelEnhancedProps {
  assumptions: FinancialAssumptions;
  onChange?: (assumptions: FinancialAssumptions) => void;
  extractedData?: Partial<FinancialAssumptions>;
}

const ASSUMPTION_GROUPS = [
  {
    name: 'Revenue',
    fields: [
      { key: 'month1Revenue' as const, label: 'Month 1 Revenue ($)', format: 'currency' },
      { key: 'monthlyGrowth' as const, label: 'Monthly Growth Rate (%)', format: 'percent' },
    ],
  },
  {
    name: 'Operating Costs',
    fields: [
      { key: 'cogsPercent' as const, label: 'COGS % of Revenue', format: 'percent' },
      { key: 'monthlyOpex' as const, label: 'Monthly OpEx ($)', format: 'currency' },
      { key: 'monthlyCapex' as const, label: 'Monthly CapEx ($)', format: 'currency' },
    ],
  },
  {
    name: 'Working Capital',
    fields: [
      { key: 'arDays' as const, label: 'Accounts Receivable Days', format: 'number' },
      { key: 'apDays' as const, label: 'Accounts Payable Days', format: 'number' },
    ],
  },
  {
    name: 'Debt & Financing',
    fields: [
      { key: 'loanAmount' as const, label: 'Loan Amount ($)', format: 'currency' },
      { key: 'loanRate' as const, label: 'Loan Interest Rate (%)', format: 'percent' },
      { key: 'loanTerm' as const, label: 'Loan Term (months)', format: 'number' },
    ],
  },
];

export function AssumptionsPanelEnhanced({
  assumptions,
  onChange,
  extractedData,
}: AssumptionsPanelEnhancedProps) {
  const handleChange = (key: keyof FinancialAssumptions, value: any) => {
    if (onChange) {
      onChange({
        ...assumptions,
        [key]: value,
      });
    }
  };

  const handleApplyExtracted = () => {
    if (onChange && extractedData) {
      onChange({
        ...assumptions,
        ...extractedData,
      });
    }
  };

  const hasExtractedData = extractedData && Object.keys(extractedData).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Zap className="h-5 w-5 text-amber-500" />
        Financial Assumptions
      </h3>

      {/* Apply Extracted Data Button */}
      {hasExtractedData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <p className="text-sm text-green-900 mb-3">
            ✓ <strong>Auto-Extracted Data Ready</strong> — We detected {Object.keys(extractedData).length} financial fields from your file.
          </p>
          <button
            onClick={handleApplyExtracted}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Apply Extracted Values
          </button>
        </motion.div>
      )}

      <div className="space-y-8">
        {ASSUMPTION_GROUPS.map((group, groupIdx) => (
          <motion.div
            key={group.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.1 }}
          >
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
              {group.name}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map(field => (
                <motion.div key={field.key} className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    {field.label}
                    {extractedData?.[field.key] !== undefined && (
                      <span className="ml-2 text-xs text-green-600">(from file)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={assumptions[field.key] as any}
                    onChange={(e) => handleChange(field.key, parseFloat(e.target.value))}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          // Changes are already applied via onChange handlers on input change
          // This button provides visual confirmation that assumptions have been set
          if (onChange) {
            onChange(assumptions);
          }
        }}
        className="mt-8 w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
      >
        ✓ Apply Changes
      </motion.button>
    </motion.div>
  );
}
