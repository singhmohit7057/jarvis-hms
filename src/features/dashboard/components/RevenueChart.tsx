// #must: Reusable revenue area chart with gradient fill, INR formatting, and responsive container

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/data/ChartCard';
import { formatCurrency } from '@/lib/formatters';

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface RevenueChartProps {
  data: RevenueDataPoint[];
  title?: string;
  height?: number;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatYAxis(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

// Custom tooltip — typed loosely to avoid recharts internal type path issues
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value?: number}[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-2 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-blue-600 dark:text-blue-400">
        {formatCurrency(typeof payload[0].value === 'number' ? payload[0].value : 0)}
      </p>
    </div>
  );
}

export function RevenueChart({ data, title = 'Revenue Trend', height = 300 }: RevenueChartProps) {
  const chartData = data.map((d) => ({ ...d, label: formatShortDate(d.date) }));

  return (
    <ChartCard title={title} subtitle="Last 7 days" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#334155]" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
