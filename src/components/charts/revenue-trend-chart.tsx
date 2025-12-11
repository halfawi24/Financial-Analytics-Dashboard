'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface DataPoint {
  month: number;
  revenue: number;
  ebitda: number;
  netCashFlow: number;
}

interface RevenueTrendChartProps {
  data: DataPoint[];
  height?: number;
}

export function RevenueTrendChart({ data, height = 300 }: RevenueTrendChartProps) {
  const chartData = data.map(d => ({
    month: `M${d.month}`,
    Revenue: d.revenue,
    EBITDA: d.ebitda,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0D9488" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorEBITDA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" stroke="#64748B" style={{ fontSize: '12px' }} />
        <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
          formatter={(value: any) => `$${((value || 0) / 1000).toFixed(0)}K`}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="Revenue"
          stroke="#0D9488"
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
        <Area
          type="monotone"
          dataKey="EBITDA"
          stroke="#F59E0B"
          fillOpacity={1}
          fill="url(#colorEBITDA)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CashFlowTrendChart({ data, height = 300 }: RevenueTrendChartProps) {
  const chartData = data.map(d => ({
    month: `M${d.month}`,
    'Net Cash Flow': d.netCashFlow,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" stroke="#64748B" style={{ fontSize: '12px' }} />
        <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
          formatter={(value: any) => `$${((value || 0) / 1000).toFixed(0)}K`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Net Cash Flow"
          stroke="#0D9488"
          dot={{ fill: '#0D9488', r: 4 }}
          activeDot={{ r: 6 }}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
