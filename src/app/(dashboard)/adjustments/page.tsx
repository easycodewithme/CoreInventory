'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, RefreshCw, Download } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdjustmentModal } from '@/components/adjustments/adjustment-modal';
import type { Adjustment } from '@/lib/types';
import { PageHeader } from '@/components/layout/page-header';
import { exportToCSV } from '@/lib/csv-export';
import { usePermission } from '@/lib/store';

// ── Component ──

export default function AdjustmentsPage() {
  const canCreate = usePermission('adjustments:create');

  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Fetch adjustments ──
  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/adjustments');
      if (!res.ok) throw new Error('Failed to fetch adjustments');
      const data = await res.json();
      setAdjustments(data);
    } catch {
      toast.error('Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  // ── Handlers ──
  function handleSuccess() {
    fetchAdjustments();
  }

  function handleExportCSV() {
    exportToCSV('adjustments', ['Reference', 'Date', 'Product', 'Previous Qty', 'Counted Qty', 'Difference', 'Reason', 'Created By'], adjustments.map((a) => [a.reference, format(new Date(a.date), 'dd MMM yyyy'), a.product?.name ?? '', String(a.previous_qty), String(a.counted_qty), String(a.difference), a.reason, a.profile?.full_name ?? '']));
  }

  // ── Render ──
  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page header */}
      <PageHeader icon={RefreshCw} title="Stock Adjustments" subtitle="Reconcile physical counts with system records">
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={adjustments.length === 0}>
          <Download className="size-4" />
          Export
        </Button>
        {canCreate && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            New Adjustment
          </Button>
        )}
      </PageHeader>

      {/* Adjustments table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Reference</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-right text-muted-foreground">Previous Qty</TableHead>
              <TableHead className="text-right text-muted-foreground">Counted Qty</TableHead>
              <TableHead className="text-right text-muted-foreground">Difference</TableHead>
              <TableHead className="text-muted-foreground">Reason</TableHead>
              <TableHead className="text-muted-foreground">Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : adjustments.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <RefreshCw className="size-10 opacity-40" />
                    <p className="text-sm">No adjustments recorded yet</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              adjustments.map((adj) => {
                const diff = adj.difference;
                const diffColor =
                  diff > 0
                    ? 'text-emerald-400'
                    : diff < 0
                    ? 'text-red-400'
                    : 'text-muted-foreground';
                const diffPrefix = diff > 0 ? '+' : '';

                return (
                  <TableRow key={adj.id} className="border-border">
                    <TableCell className="font-mono text-sm font-medium text-indigo-400">
                      {adj.reference}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(adj.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {adj.product?.name ?? '\u2014'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {adj.previous_qty}
                    </TableCell>
                    <TableCell className="text-right font-mono text-foreground">
                      {adj.counted_qty}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-medium ${diffColor}`}>
                      {diffPrefix}{diff}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {adj.reason}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {adj.profile?.full_name ?? '\u2014'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* New adjustment modal */}
      <AdjustmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
