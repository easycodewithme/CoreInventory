'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Search, History, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Move } from '@/lib/types';
import { MOVE_TYPE_COLORS } from '@/lib/types';
import { PageHeader } from '@/components/layout/page-header';
import { exportToCSV } from '@/lib/csv-export';

// ── Types ──

const MOVE_TYPES = ['ALL', 'RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT'] as const;
type MoveTypeFilter = (typeof MOVE_TYPES)[number];

// ── Component ──

export default function HistoryPage() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<MoveTypeFilter>('ALL');
  const [search, setSearch] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch moves ──
  const fetchMoves = useCallback(async (type: MoveTypeFilter, query: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type !== 'ALL') params.set('type', type);
      if (query) params.set('search', query);
      const url = `/api/moves${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch moves');
      const data = await res.json();
      setMoves(data);
    } catch {
      toast.error('Failed to load move history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMoves(typeFilter, search);
  }, [typeFilter, fetchMoves]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMoves(typeFilter, search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, typeFilter, fetchMoves]);

  function handleExportCSV() {
    exportToCSV('move-history', ['Date', 'Type', 'Reference', 'Product', 'Quantity', 'From', 'To', 'Created By'], moves.map((m) => [format(new Date(m.date), 'dd MMM yyyy, HH:mm'), m.type, m.reference, m.product?.name ?? '', String(m.quantity), m.from_location || '', m.to_location || '', m.profile?.full_name ?? '']));
  }

  // ── Render ──
  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page header */}
      <PageHeader icon={History} title="Move History" subtitle="Complete stock movement ledger">
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={moves.length === 0}>
          <Download className="size-4" />
          Export
        </Button>
      </PageHeader>

      {/* Filters row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Type filter toggle group */}
        <div className="inline-flex rounded-lg border border-border bg-[#141417] p-0.5">
          {MOVE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                typeFilter === type
                  ? 'bg-[#6366f1] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by product or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Moves table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Reference</TableHead>
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-right text-muted-foreground">Quantity</TableHead>
              <TableHead className="text-muted-foreground">From</TableHead>
              <TableHead className="text-muted-foreground">To</TableHead>
              <TableHead className="text-muted-foreground">Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : moves.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <History className="size-10 opacity-40" />
                    <p className="text-sm">No moves found</p>
                    {search && (
                      <p className="text-xs">
                        Try adjusting your search query
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              moves.map((move) => {
                const qty = move.quantity;
                const qtyColor =
                  qty > 0
                    ? 'text-emerald-400'
                    : qty < 0
                    ? 'text-red-400'
                    : 'text-muted-foreground';
                const qtyPrefix = qty > 0 ? '+' : '';
                const typeBadgeClass =
                  MOVE_TYPE_COLORS[move.type] ?? 'bg-zinc-700 text-zinc-200';

                return (
                  <TableRow key={move.id} className="border-border">
                    <TableCell className="text-muted-foreground">
                      {format(new Date(move.date), 'dd MMM yyyy, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${typeBadgeClass}`}
                      >
                        {move.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium text-indigo-400">
                      {move.reference}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {move.product?.name ?? '\u2014'}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-medium ${qtyColor}`}>
                      {qtyPrefix}{qty}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {move.from_location || '\u2014'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {move.to_location || '\u2014'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {move.profile?.full_name ?? '\u2014'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
