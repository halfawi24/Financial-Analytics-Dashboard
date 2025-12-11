'use client';

import { Assumptions } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface AssumeEditorProps {
  assumptions: Assumptions;
  onAssumptionsChange: (assumptions: Assumptions) => void;
}

export function AssumeEditor({
  assumptions,
  onAssumptionsChange,
}: AssumeEditorProps) {
  const handleChange = (key: keyof Assumptions, value: number) => {
    onAssumptionsChange({
      ...assumptions,
      [key]: value,
    });
  };

  interface Field {
    key: keyof Assumptions;
    label: string;
    suffix: string;
    scale?: number;
  }

  const sections: Array<{ title: string; fields: Field[] }> = [
    {
      title: 'Cash & Revenue',
      fields: [
        { key: 'openingCash', label: 'Opening Cash', suffix: '$' },
        { key: 'month1Revenue', label: 'Month 1 Revenue', suffix: '$' },
        {
          key: 'monthlyGrowth',
          label: 'Monthly Growth %',
          suffix: '%',
          scale: 100,
        },
      ],
    },
    {
      title: 'Operating Metrics',
      fields: [
        {
          key: 'cogsPercent',
          label: 'COGS % of Revenue',
          suffix: '%',
          scale: 100,
        },
        { key: 'monthlyOpex', label: 'Monthly OpEx', suffix: '$' },
        { key: 'monthlyCapex', label: 'Monthly CapEx', suffix: '$' },
        {
          key: 'taxRate',
          label: 'Tax Rate %',
          suffix: '%',
          scale: 100,
        },
      ],
    },
    {
      title: 'Working Capital',
      fields: [
        { key: 'arDays', label: 'AR Days Outstanding', suffix: '' },
        { key: 'apDays', label: 'AP Days Outstanding', suffix: '' },
      ],
    },
    {
      title: 'Funding Instruments',
      fields: [
        { key: 'locAmount', label: 'LOC Amount', suffix: '$' },
        {
          key: 'locRate',
          label: 'LOC Rate %',
          suffix: '%',
          scale: 100,
        },
        {
          key: 'factoringFee',
          label: 'Factoring Fee %',
          suffix: '%',
          scale: 100,
        },
        { key: 'loanAmount', label: 'Loan Amount', suffix: '$' },
        { key: 'loanTerm', label: 'Loan Term (months)', suffix: '' },
        {
          key: 'loanRate',
          label: 'Loan Rate %',
          suffix: '%',
          scale: 100,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Edit Assumptions
        </h2>
        <p className="text-sm text-muted-foreground">
          Changes update all forecasts in real-time
        </p>
      </div>

      {sections.map((section, sectionIdx) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIdx * 0.05 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {section.title}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.fields.map((field) => {
              const value =
                assumptions[field.key] /
                (field.scale ? field.scale : 1);

              return (
                <div key={field.key}>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        const numValue =
                          parseFloat(e.target.value) *
                          (field.scale ? field.scale : 1);
                        handleChange(field.key, numValue);
                      }}
                      className="flex-1 px-3 py-2 bg-input border border-border rounded text-foreground"
                      step={field.scale ? '0.01' : '1'}
                    />
                    <span className="text-sm text-muted-foreground w-6">
                      {field.suffix}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
