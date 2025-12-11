'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: number | string;
  format?: 'currency' | 'number' | 'percent' | 'text';
  status?: 'positive' | 'negative' | 'neutral';
  change?: number;
  index?: number;
}

export function KPICard({
  label,
  value,
  format = 'currency',
  status = 'neutral',
  change,
  index = 0,
}: KPICardProps) {
  const formatValue = () => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('en-US').format(Math.round(value));
      case 'percent':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return value;
    }
  };

  const statusColor = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-600 dark:text-slate-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {formatValue()}
          </p>
        </div>
      </div>

      {change !== undefined && (
        <div className={cn('text-xs mt-3 font-medium', statusColor[status])}>
          {change > 0 ? '↑' : change < 0 ? '↓' : '→'}{' '}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </motion.div>
  );
}
