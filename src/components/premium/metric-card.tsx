'use client';

import { motion } from 'framer-motion';
import { ReactNode, ComponentType, SVGProps } from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  format?: 'currency' | 'number' | 'percent' | 'text';
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  trend?: number;
  riskLevel?: 'critical' | 'warning' | 'healthy' | 'excellent';
  index?: number;
  color?: 'emerald' | 'green' | 'red' | 'yellow';
  isFinal?: boolean;
}

export function MetricCard({
  label,
  value,
  format = 'currency',
  icon: Icon,
  trend,
  riskLevel = 'healthy',
  index = 0,
  color = 'emerald',
  isFinal = false,
}: MetricCardProps) {
  const formatValue = () => {
    if (typeof value === 'string') return value;
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
        return new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 0,
        }).format(value);
      default:
        return value;
    }
  };

  const riskColors = {
    critical: 'from-red-500/20 to-red-600/10 border-red-500/30',
    warning: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    healthy: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    excellent: 'from-green-500/20 to-green-600/10 border-green-500/30',
  };

  const riskIconColors = {
    critical: 'text-red-400',
    warning: 'text-yellow-400',
    healthy: 'text-emerald-400',
    excellent: 'text-green-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: 'easeOut',
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`glass group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 ${riskColors[riskLevel]}`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="mt-3 flex items-baseline gap-3">
              <motion.p
                key={formatValue()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-3xl font-bold text-foreground"
              >
                {formatValue()}
              </motion.p>
              {trend !== undefined && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-sm font-semibold ${
                    trend > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                </motion.span>
              )}
            </div>
          </div>

          {Icon && <Icon className={`h-6 w-6 ${riskIconColors[riskLevel]}`} />}
        </div>
      </div>

      {/* Premium border accent */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
    </motion.div>
  );
}
