'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';
import { MonthlyMetrics } from '@/lib/financial-engine';

interface AdvancedChartsProps {
  data: MonthlyMetrics[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-lg border border-indigo-500/30 p-3 shadow-xl"
    >
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="text-sm font-medium">
          {entry.name}: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(entry.value)}
        </p>
      ))}
    </motion.div>
  );
};

export function CashFlowChart({ data }: AdvancedChartsProps) {
  const chartData = data.map((m) => ({
    month: `M${m.month}`,
    'Ending Cash': Math.round(m.endingCash),
    'Net Cash Flow': Math.round(m.netCashFlow),
    'EBITDA': Math.round(m.ebitda),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass group relative overflow-hidden rounded-2xl border border-indigo-500/20 p-6 backdrop-blur-xl"
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-xl" />
      </div>

      <div className="relative z-10">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Cash Flow Dynamics</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="gradientCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientEbitda" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
            <XAxis dataKey="month" stroke="rgb(168, 162, 141)" />
            <YAxis stroke="rgb(168, 162, 141)" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="Ending Cash"
              fill="url(#gradientCash)"
              stroke="#6366f1"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="EBITDA"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
            />
            <Bar dataKey="Net Cash Flow" fill="#a78bfa" opacity={0.7} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function RevenueChart({ data }: AdvancedChartsProps) {
  const chartData = data.map((m) => ({
    month: `M${m.month}`,
    Revenue: Math.round(m.revenue),
    'Gross Profit': Math.round(m.grossProfit),
    EBITDA: Math.round(m.ebitda),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass group relative overflow-hidden rounded-2xl border border-amber-500/20 p-6 backdrop-blur-xl"
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 blur-xl" />
      </div>

      <div className="relative z-10">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Profitability Waterfall</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(251, 191, 36, 0.1)" />
            <XAxis dataKey="month" stroke="rgb(168, 162, 141)" />
            <YAxis stroke="rgb(168, 162, 141)" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="Revenue"
              stackId="1"
              fill="url(#gradientRevenue)"
              stroke="#fbbf24"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Gross Profit"
              stackId="2"
              fill="#a78bfa"
              stroke="#a78bfa"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="EBITDA"
              stackId="3"
              fill="#6366f1"
              stroke="#6366f1"
              strokeWidth={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
