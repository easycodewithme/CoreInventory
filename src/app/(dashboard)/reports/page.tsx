'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Download,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { exportToCSV } from '@/lib/csv-export';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ReportsData {
  stock_by_category: { name: string; value: number }[];
  movement_trends: { date: string; receipts: number; deliveries: number; adjustments: number }[];
  low_stock_items: { id: string; sku: string; name: string; on_hand: number; reorder_level: number; cost_per_unit: number }[];
  top_products_by_value: { name: string; value: number; quantity: number }[];
}

const currencyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const BAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          setData(await res.json());
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchReports();
  }, []);

  const lowStockColumns: Column<ReportsData['low_stock_items'][0]>[] = [
    { key: 'sku', header: 'SKU', sortable: true, render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    { key: 'name', header: 'Product', sortable: true },
    { key: 'on_hand', header: 'On Hand', sortable: true, align: 'right', render: (r) => <span className="font-mono font-semibold text-red-400">{r.on_hand}</span> },
    { key: 'reorder_level', header: 'Reorder Level', sortable: true, align: 'right', render: (r) => <span className="font-mono">{r.reorder_level}</span> },
    { key: 'cost_per_unit', header: 'Unit Cost', sortable: true, align: 'right', render: (r) => currencyFmt.format(r.cost_per_unit) },
  ];

  function exportLowStock() {
    if (!data) return;
    exportToCSV('low-stock-report', ['SKU', 'Product', 'On Hand', 'Reorder Level', 'Unit Cost'], data.low_stock_items.map((i) => [i.sku, i.name, String(i.on_hand), String(i.reorder_level), String(i.cost_per_unit)]));
  }

  const tooltipStyle = {
    background: '#141417',
    border: '1px solid #2a2a32',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#e4e4e7',
  };

  if (loading) {
    return (
      <div className="animate-fade-in-up space-y-6">
        <PageHeader icon={TrendingUp} title="Reports" subtitle="Analytics and insights" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-[200px] w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <PageHeader icon={TrendingUp} title="Reports" subtitle="Analytics and insights" />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Stock Value by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Stock Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.stock_by_category && data.stock_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.stock_by_category} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => currencyFmt.format(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => currencyFmt.format(Number(v))} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.stock_by_category.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Products by Value */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 10 Products by Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.top_products_by_value && data.top_products_by_value.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.top_products_by_value} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => currencyFmt.format(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => currencyFmt.format(Number(v))} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Trends (full width) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Stock Movement Trends (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.movement_trends && data.movement_trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.movement_trends} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="rptReceiptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rptDeliveriesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#2a2a32' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => formatDate(String(label))} />
                <Area type="monotone" dataKey="receipts" name="Receipts" stroke="#22c55e" strokeWidth={2} fill="url(#rptReceiptsGrad)" dot={false} />
                <Area type="monotone" dataKey="deliveries" name="Deliveries" stroke="#3b82f6" strokeWidth={2} fill="url(#rptDeliveriesGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No movement data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4 text-red-400" />
            Low Stock Report
          </CardTitle>
          {data?.low_stock_items && data.low_stock_items.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportLowStock}>
              <Download className="mr-1.5 size-3.5" />
              Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {data?.low_stock_items ? (
            <DataTable
              data={data.low_stock_items}
              columns={lowStockColumns}
              keyExtractor={(r) => r.id}
              renderEmpty={() => (
                <p className="py-12 text-center text-sm text-muted-foreground">All products are well-stocked</p>
              )}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
