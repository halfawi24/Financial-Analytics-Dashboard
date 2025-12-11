'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioMetric {
  label: string;
  base: number;
  best: number;
  worst: number;
  format?: 'currency' | 'number' | 'percent';
}

interface ScenarioComparisonProps {
  metrics: ScenarioMetric[];
  activeScenario: 'base' | 'best' | 'worst';
}

export function ScenarioComparison({ metrics, activeScenario }: ScenarioComparisonProps) {
  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return `${(value * 100).toFixed(1)}%`;
      case 'number':
      default:
        return value.toFixed(2);
    }
  };

  const getVariance = (base: number, compared: number) => {
    if (base === 0) return 0;
    return ((compared - base) / Math.abs(base)) * 100;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 5) return 'text-green-600';
    if (variance < -5) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-x-auto"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-6">Scenario Comparison</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="px-4 py-3 text-left font-semibold text-slate-700 bg-slate-50">Metric</th>
            <th className={cn(
              'px-4 py-3 text-right font-semibold bg-slate-50',
              activeScenario === 'base' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            )}>Base Case</th>
            <th className={cn(
              'px-4 py-3 text-right font-semibold bg-slate-50',
              activeScenario === 'best' ? 'bg-green-50 text-green-700' : 'text-slate-700'
            )}>Best Case</th>
            <th className={cn(
              'px-4 py-3 text-right font-semibold bg-slate-50',
              activeScenario === 'worst' ? 'bg-red-50 text-red-700' : 'text-slate-700'
            )}>Worst Case</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700 bg-slate-50">Variance</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, idx) => {
            const baseVariance = getVariance(metric.base, activeScenario === 'best' ? metric.best : metric.worst);
            return (
              <motion.tr
                key={metric.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-900">{metric.label}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-900">
                  {formatValue(metric.base, metric.format)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-green-700">
                  {formatValue(metric.best, metric.format)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-red-700">
                  {formatValue(metric.worst, metric.format)}
                </td>
                <td className={cn(
                  'px-4 py-3 text-right font-semibold font-mono',
                  getVarianceColor(baseVariance)
                )}>
                  <div className="flex items-center justify-end gap-1">
                    {baseVariance > 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4" />
                        +{baseVariance.toFixed(1)}%
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4" />
                        {baseVariance.toFixed(1)}%
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
