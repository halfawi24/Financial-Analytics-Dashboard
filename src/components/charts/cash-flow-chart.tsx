'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyData } from '@/lib/calculations';

interface CashFlowChartProps {
  data: MonthlyData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const chartData = data.map((m) => ({
    month: `M${m.month}`,
    revenue: Math.round(m.revenue),
    ebitda: Math.round(m.ebitda),
    netCashFlow: Math.round(m.netCashFlow),
    endingCash: Math.round(m.endingCash),
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        12-Month Cash Flow
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(Number(value))
            }
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="hsl(184, 100%, 50%)"
            strokeWidth={2}
            dot={{ fill: 'hsl(184, 100%, 50%)', r: 4 }}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="endingCash"
            stroke="hsl(210, 40%, 50%)"
            strokeWidth={2}
            dot={{ fill: 'hsl(210, 40%, 50%)', r: 4 }}
            name="Ending Cash"
          />
          <Line
            type="monotone"
            dataKey="netCashFlow"
            stroke="hsl(195, 89%, 47%)"
            strokeWidth={2}
            dot={{ fill: 'hsl(195, 89%, 47%)', r: 4 }}
            name="Net CF"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
