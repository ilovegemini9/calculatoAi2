'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '@/components/admin/EmptyState';
import { BarChart3 } from 'lucide-react';

interface TrafficPoint {
  date: string;
  views: number;
}

interface TrafficChartProps {
  data: TrafficPoint[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-5 h-5" />}
        title="No traffic data"
        description="Page view data will appear here once analytics are recorded."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
          cursor={{ stroke: 'var(--border)' }}
        />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#2563eb' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
