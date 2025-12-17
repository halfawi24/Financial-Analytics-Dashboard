'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DataPoint {
  month: number;
  revenue: number;
  cogs: number;
  opex: number;
}

interface ComparisonChartsProps {
  data: DataPoint[];
  height?: number;
}

const COLORS = ['#0D9488', '#F59E0B', '#EF4444'];

const CustomTooltip = (props: any) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-lg">
        <p className="text-sm font-semibold text-slate-900">
          ${((payload[0].value as number) / 1000).toFixed(0)}K
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueBreakdownChart({ data, height = 300 }: ComparisonChartsProps) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalCOGS = data.reduce((sum, d) => sum + d.cogs, 0);
  const totalOpex = data.reduce((sum, d) => sum + d.opex, 0);

  const pieData = [
    { name: 'Revenue', value: totalRevenue },
    { name: 'COGS', value: totalCOGS },
    { name: 'OpEx', value: totalOpex },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function InflowOutflowChart({ data, height = 300 }: ComparisonChartsProps) {
  const chartData = data.map(d => ({
    month: `M${d.month}`,
    Inflow: d.revenue,
    Outflow: d.cogs + d.opex,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" stroke="#64748B" style={{ fontSize: '12px' }} />
        <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="Inflow" fill="#0D9488" />
        <Bar dataKey="Outflow" fill="#EF4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpenseBreakdownChart({ data, height = 300 }: ComparisonChartsProps) {
  const totalCOGS = data.reduce((sum, d) => sum + d.cogs, 0);
  const totalOpex = data.reduce((sum, d) => sum + d.opex, 0);

  const pieData = [
    { name: 'COGS', value: totalCOGS },
    { name: 'Operating Expenses', value: totalOpex },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
