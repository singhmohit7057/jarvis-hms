// #must: Flexible chart wrapper rendering Recharts chart types by type prop

import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from '@/components/data/ChartCard';

export interface ChartDataKey {
  key: string;
  color: string;
  label: string;
}

export interface ReportChartProps {
  type: 'line' | 'bar' | 'area' | 'pie';
  data: Record<string, unknown>[];
  dataKeys: ChartDataKey[];
  xAxisKey?: string;
  title?: string;
  height?: number;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
];

export function ReportChart({
  type,
  data,
  dataKeys,
  xAxisKey = 'name',
  title,
  height = 300,
}: ReportChartProps) {
  const renderChart = () => {
    if (type === 'pie') {
      const firstKey = dataKeys[0]?.key ?? 'value';
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={firstKey}
            nameKey={xAxisKey}
            cx="50%"
            cy="50%"
            outerRadius={Math.min(height / 2 - 20, 120)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={({ name, percent }: any) =>
              `${name ?? ''} (${((percent ?? 0) * 100).toFixed(1)}%)`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  dataKeys[index]?.color ??
                  DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
              />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const formatted = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value ?? '');
              return [formatted, name != null ? String(name) : ''] as [string, string];
            }}
          />
          <Legend />
        </PieChart>
      );
    }

    const commonAxisProps = {
      tick: { fontSize: 12, fill: '#6b7280' },
    };

    const commonGridProps = {
      strokeDasharray: '3 3',
      stroke: '#e5e7eb',
    };

    if (type === 'line') {
      return (
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid {...commonGridProps} />
          <XAxis dataKey={xAxisKey} {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const formatted = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value ?? '');
              return [formatted, name != null ? String(name) : ''] as [string, string];
            }}
          />
          <Legend />
          {dataKeys.map((dk) => (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.label}
              stroke={dk.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      );
    }

    if (type === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid {...commonGridProps} />
          <XAxis dataKey={xAxisKey} {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const formatted = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value ?? '');
              return [formatted, name != null ? String(name) : ''] as [string, string];
            }}
          />
          <Legend />
          {dataKeys.map((dk) => (
            <Bar key={dk.key} dataKey={dk.key} name={dk.label} fill={dk.color} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      );
    }

    // area (default)
    return (
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid {...commonGridProps} />
        <XAxis dataKey={xAxisKey} {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
            if (value === undefined) return ['', ''];
            const formatted = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value);
            return [formatted, name !== undefined ? String(name) : ''];
          }}
        />
        <Legend />
        {dataKeys.map((dk) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.label}
            stroke={dk.color}
            fill={`${dk.color}20`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    );
  };

  if (title) {
    return (
      <ChartCard title={title} height={height}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
}
