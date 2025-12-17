'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIStripProps {
  metrics: {
    revenue: number;
    ebitda: number;
    cash: number;
    dscr: number;
    runway: number;
    margin: number;
  };
  scenario: 'base' | 'best' | 'worst';
}

export function KPIStrip({ metrics }: KPIStripProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (value: number) => value.toFixed(2);

  const kpis = [
    { label: '12M Revenue', value: metrics.revenue, format: formatCurrency, icon: TrendingUp, color: 'text-teal-600' },
    { label: 'Total EBITDA', value: metrics.ebitda, format: formatCurrency, icon: Target, color: 'text-teal-600' },
    { label: 'Cash Balance', value: metrics.cash, format: formatCurrency, icon: Zap, color: metrics.cash > 200000 ? 'text-green-600' : 'text-yellow-600' },
    { label: 'DSCR', value: metrics.dscr, format: formatNumber, icon: AlertCircle, color: metrics.dscr > 1.5 ? 'text-green-600' : 'text-red-600' },
    { label: 'Runway (mo)', value: metrics.runway, format: (v: number) => Math.round(v).toString(), icon: TrendingUp, color: 'text-blue-600' },
    { label: 'EBITDA Margin', value: metrics.margin, format: formatPercent, icon: Target, color: 'text-amber-600' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm"
    >
      <div className="max-w-full px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                variants={itemVariants}
                className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
                    {kpi.label}
                  </p>
                  <p className="text-sm font-bold text-slate-900 truncate mt-1">
                    {kpi.format(kpi.value)}
                  </p>
                </div>
                <Icon className={cn('h-4 w-4 ml-2 flex-shrink-0 mt-1', kpi.color)} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
