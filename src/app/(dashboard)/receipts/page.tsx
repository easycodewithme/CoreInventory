'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileInput, Plus, Download, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, STATUS_COLORS } from '@/lib/types';
import { PageHeader } from '@/components/layout/page-header';
import { exportToCSV } from '@/lib/csv-export';

const STATUSES = ['All', 'DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED'] as const;
const KANBAN_STATUSES = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED'] as const;

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeStatus !== 'All' ? `?status=${activeStatus}` : '';
      const res = await fetch(`/api/receipts${params}`);
      if (!res.ok) throw new Error('Failed to fetch receipts');
      const data = await res.json();
      setReceipts(data);
    } catch (err) {
      toast.error('Failed to load receipts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  async function handleNewReceipt() {
    setCreating(true);
    try {
      const res = await fetch('/api/receipts', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create receipt');
      const data = await res.json();
      router.push(`/receipts/${data.id}`);
    } catch (err) {
      toast.error('Failed to create receipt');
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  function handleExportCSV() {
    exportToCSV('receipts', ['Reference', 'Date', 'Supplier', 'Items', 'Status', 'Total Qty'], receipts.map((r) => {
      const items = r.receipt_items?.length ?? 0;
      const qty = r.receipt_items?.reduce((s, i) => s + i.ordered_qty, 0) ?? 0;
      return [r.reference, formatDate(r.date), r.supplier_name || '', String(items), r.status, String(qty)];
    }));
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <PageHeader icon={FileInput} title="Receipts" subtitle="Incoming stock from vendors">
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={receipts.length === 0}>
          <Download className="size-4" />
          Export
        </Button>
        <Button onClick={handleNewReceipt} disabled={creating}>
          <Plus className="size-4" />
          {creating ? 'Creating...' : 'New Receipt'}
        </Button>
      </PageHeader>

      {/* Status Filters & View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeStatus === status
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {status === 'All' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setViewMode('table')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'table'
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            title="Table view"
          >
            <List className="size-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'kanban'
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            title="Kanban view"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="mx-auto h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                    </TableRow>
                  ))
                ) : receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((receipt) => {
                    const itemCount = receipt.receipt_items?.length ?? 0;
                    const totalQty = receipt.receipt_items?.reduce(
                      (sum, item) => sum + item.ordered_qty,
                      0
                    ) ?? 0;

                    return (
                      <TableRow
                        key={receipt.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/receipts/${receipt.id}`)}
                      >
                        <TableCell>
                          <Link
                            href={`/receipts/${receipt.id}`}
                            className="font-mono text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {receipt.reference}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(receipt.date)}
                        </TableCell>
                        <TableCell>{receipt.supplier_name || '—'}</TableCell>
                        <TableCell className="text-center">{itemCount}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_COLORS[receipt.status] ?? ''
                            }`}
                          >
                            {receipt.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {totalQty}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Kanban View */
        <div className="overflow-x-auto pb-4">
          {loading ? (
            <div className="flex gap-4">
              {KANBAN_STATUSES.map((status) => (
                <div key={status} className="min-w-[260px] flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-6" />
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4">
              {KANBAN_STATUSES.map((status) => {
                const columnReceipts = receipts.filter((r) => r.status === status);
                return (
                  <div key={status} className="min-w-[260px] flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[status] ?? ''
                        }`}
                      >
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {columnReceipts.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {columnReceipts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          No receipts
                        </div>
                      ) : (
                        columnReceipts.map((receipt) => {
                          const itemCount = receipt.receipt_items?.length ?? 0;
                          return (
                            <div
                              key={receipt.id}
                              className="cursor-pointer rounded-lg border border-border bg-card p-3 transition-colors hover:border-indigo-500/50 hover:bg-accent"
                              onClick={() => router.push(`/receipts/${receipt.id}`)}
                            >
                              <div className="mb-1 font-mono text-sm font-bold text-indigo-400">
                                {receipt.reference}
                              </div>
                              <div className="mb-1 text-sm">
                                {receipt.supplier_name || '—'}
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{formatDate(receipt.date)}</span>
                                <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
