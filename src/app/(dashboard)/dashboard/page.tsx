'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  FileInput,
  Truck,
  IndianRupee,
  ArrowUpRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_COLORS } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { StockMovementChart, CategoryDistributionChart } from '@/components/dashboard/charts';

// ── Types ──

interface DashboardData {
  total_products: number;
  low_stock_count: number;
  pending_receipts: number;
  pending_deliveries: number;
  total_stock_value: number;
  recent_receipts: RecentReceipt[];
  recent_deliveries: RecentDelivery[];
  low_stock_items: LowStockItem[];
  stock_movement_trend: { date: string; receipts: number; deliveries: number }[];
  category_distribution: { name: string; value: number }[];
}

interface RecentReceipt {
  id: string;
  reference: string;
  supplier_name: string;
  status: string;
  created_at: string;
}

interface RecentDelivery {
  id: string;
  reference: string;
  customer_name: string;
  status: string;
  created_at: string;
}

interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  on_hand: number;
  reorder_level: number;
}

// ── Helpers ──

const currencyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Animated number hook ──

function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    let start: number | null = null;
    let rafId: number;

    function step(timestamp: number) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}

// ── KPI Card ──

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  borderColor: string;
  formatAsCurrency?: boolean;
  loading?: boolean;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accentColor,
  borderColor,
  formatAsCurrency = false,
  loading = false,
}: KpiCardProps) {
  const animatedValue = useAnimatedNumber(value);

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: borderColor }}>
        <CardContent className="flex items-start justify-between pt-5 pb-5">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="size-10 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-l-4 transition-all duration-200 hover:ring-1 hover:ring-[#2a2a32]" style={{ borderLeftColor: borderColor }}>
      <CardContent className="flex items-start justify-between pt-5 pb-5">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
          <p className="text-2xl font-semibold font-mono tracking-tight text-foreground">
            {formatAsCurrency ? currencyFmt.format(animatedValue) : animatedValue.toLocaleString('en-IN')}
          </p>
        </div>
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <Icon className="size-5" style={{ color: accentColor }} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Status Badge ──

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-zinc-700 text-zinc-200';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
}

// ── Skeleton for recent lists ──

function RecentListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Quick Action Card ──

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-secondary/50"
    >
      <div className="flex size-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
        <Icon className="size-4" style={{ color }} />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}

// ── Main Page ──

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {getGreeting()}{user ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your inventory today
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Total Products in Stock"
          value={data?.total_products ?? 0}
          icon={Package}
          accentColor="#e4e4e7"
          borderColor="#e4e4e7"
          loading={loading}
        />
        <KpiCard
          title="Low / Out of Stock"
          value={data?.low_stock_count ?? 0}
          icon={AlertTriangle}
          accentColor={data && data.low_stock_count > 0 ? '#ef4444' : '#22c55e'}
          borderColor={data && data.low_stock_count > 0 ? '#ef4444' : '#22c55e'}
          loading={loading}
        />
        <KpiCard
          title="Pending Receipts"
          value={data?.pending_receipts ?? 0}
          icon={FileInput}
          accentColor="#f59e0b"
          borderColor="#f59e0b"
          loading={loading}
        />
        <KpiCard
          title="Pending Deliveries"
          value={data?.pending_deliveries ?? 0}
          icon={Truck}
          accentColor="#3b82f6"
          borderColor="#3b82f6"
          loading={loading}
        />
        <KpiCard
          title="Total Stock Value"
          value={data?.total_stock_value ?? 0}
          icon={IndianRupee}
          accentColor="#22c55e"
          borderColor="#22c55e"
          formatAsCurrency
          loading={loading}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction href="/receipts" icon={Plus} label="New Receipt" color="#22c55e" />
        <QuickAction href="/deliveries" icon={Plus} label="New Delivery" color="#3b82f6" />
        <QuickAction href="/products" icon={Plus} label="New Product" color="#6366f1" />
        <QuickAction href="/adjustments" icon={RefreshCw} label="Stock Adjustment" color="#f59e0b" />
      </div>

      {/* ── Charts Row ── */}
      {!loading && data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Stock Movement Trends (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.stock_movement_trend?.length > 0 ? (
                <StockMovementChart data={data.stock_movement_trend} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No movement data yet</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Stock Value by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.category_distribution?.length > 0 ? (
                <CategoryDistributionChart data={data.category_distribution} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No category data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Recent Receipts & Deliveries ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Receipts */}
        {loading ? (
          <RecentListSkeleton />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileInput className="size-4 text-amber-400" />
                Recent Receipts
              </CardTitle>
              <Link
                href="/receipts"
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-indigo-400"
              >
                View all
                <ArrowUpRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {data?.recent_receipts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No receipts yet
                </p>
              ) : (
                <div className="space-y-3">
                  {data?.recent_receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[#1a1a1f]"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/receipts/${receipt.id}`}
                          className="font-mono text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300 hover:underline"
                        >
                          {receipt.reference}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {receipt.supplier_name}
                        </p>
                      </div>
                      <StatusBadge status={receipt.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Deliveries */}
        {loading ? (
          <RecentListSkeleton />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Truck className="size-4 text-blue-400" />
                Recent Deliveries
              </CardTitle>
              <Link
                href="/deliveries"
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-indigo-400"
              >
                View all
                <ArrowUpRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {data?.recent_deliveries.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No deliveries yet
                </p>
              ) : (
                <div className="space-y-3">
                  {data?.recent_deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[#1a1a1f]"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/deliveries/${delivery.id}`}
                          className="font-mono text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300 hover:underline"
                        >
                          {delivery.reference}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {delivery.customer_name}
                        </p>
                      </div>
                      <StatusBadge status={delivery.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Low Stock Alerts ── */}
      {!loading && data && data.low_stock_count > 0 && (
        <Card className="border-red-900/50 bg-red-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-400">
              <AlertTriangle className="size-4" />
              Low Stock Items
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-red-900/60 text-[11px] font-semibold text-red-300">
                {data.low_stock_count}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.low_stock_items.map((item) => (
                <Link
                  key={item.id}
                  href="/products"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-red-950/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground/60">
                      {item.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-mono text-sm font-semibold text-red-400">
                      {item.on_hand}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (reorder: {item.reorder_level})
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
