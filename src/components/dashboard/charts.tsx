'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ── Sparkline ──

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function SparklineChart({ data, color = '#6366f1', height = 32 }: SparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Stock Movement Chart ──

interface MovementTrend {
  date: string;
  receipts: number;
  deliveries: number;
}

interface StockMovementChartProps {
  data: MovementTrend[];
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function StockMovementChart({ data }: StockMovementChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="receiptsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="deliveriesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={{ stroke: '#2a2a32' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#141417',
            border: '1px solid #2a2a32',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#e4e4e7',
          }}
          labelFormatter={(label) => formatDate(String(label))}
        />
        <Area
          type="monotone"
          dataKey="receipts"
          name="Receipts"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#receiptsGrad)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="deliveries"
          name="Deliveries"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#deliveriesGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Category Distribution Chart ──

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryDistributionChartProps {
  data: CategoryData[];
}

const DONUT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const currencyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#141417',
              border: '1px solid #2a2a32',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e4e4e7',
            }}
            formatter={(value) => currencyFmt.format(Number(value))}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-1 flex-col gap-1.5">
        {data.slice(0, 6).map((item, i) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <div
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="truncate text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-mono text-foreground">
              {currencyFmt.format(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
