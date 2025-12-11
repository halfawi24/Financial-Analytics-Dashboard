'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'number' | 'percent';
  status?: 'excellent' | 'healthy' | 'warning' | 'critical';
  trend?: number;
  index?: number;
}

export function MetricCard({
  label,
  value,
  format = 'currency',
  status = 'healthy',
  trend,
  index = 0,
}: MetricCardProps) {
  const formatValue = () => {
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
        return value.toFixed(2);
      default:
        return value;
    }
  };

  const statusStyles = {
    excellent: 'bg-slate-900 border-slate-700',
    healthy: 'bg-teal-900 border-teal-700',
    warning: 'bg-amber-900 border-amber-700',
    critical: 'bg-red-900 border-red-700',
  };

  const statusTextStyles = {
    excellent: 'text-white',
    healthy: 'text-white',
    warning: 'text-white',
    critical: 'text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'card border-2 p-4',
        statusStyles[status]
      )}
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-baseline justify-between gap-2">
        <p className={cn('text-2xl font-bold font-mono', statusTextStyles[status])}>
          {formatValue()}
        </p>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold',
            trend > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {trend > 0 ? (
              <>
                <ArrowUpRight className="h-3 w-3" />
                +{trend.toFixed(1)}%
              </>
            ) : (
              <>
                <ArrowDownRight className="h-3 w-3" />
                {Math.abs(trend).toFixed(1)}%
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface MetricGridProps {
  metrics: Array<{
    label: string;
    value: number;
    format?: 'currency' | 'number' | 'percent';
    status?: 'excellent' | 'healthy' | 'warning' | 'critical';
    trend?: number;
  }>;
}

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, idx) => (
        <MetricCard
          key={metric.label}
          index={idx}
          {...metric}
        />
      ))}
    </div>
  );
}
