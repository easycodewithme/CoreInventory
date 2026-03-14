'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Pencil, Check, X, Package, Download, BarChart3 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { exportToCSV } from '@/lib/csv-export';
import { usePermission } from '@/lib/store';

// ── Types ──

interface StockLocation {
  id: string;
  location: {
    id: string;
    name: string;
    short_code: string;
  } | null;
  quantity: number;
}

interface StockProduct {
  id: string;
  name: string;
  sku: string;
  unit_of_measure: string;
  cost_per_unit: number;
  reorder_level: number;
  category_id: string | null;
}

interface StockRow {
  product_id: string;
  product: StockProduct | null;
  on_hand: number;
  free_to_use: number;
  locations: StockLocation[];
}

// ── Helpers ──

const currencyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

// ── Component ──

export default function StockPage() {
  const canEditStock = usePermission('stock:edit');

  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch stock ──
  const fetchStock = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const url = query
        ? `/api/stock?search=${encodeURIComponent(query)}`
        : '/api/stock';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch stock');
      const data = await res.json();
      setStockRows(data);
    } catch {
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchStock(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, fetchStock]);

  // ── Inline edit handlers ──
  function startEdit(productId: string, currentOnHand: number) {
    setEditingId(productId);
    setEditValues({ [productId]: currentOnHand });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  async function saveEdit(row: StockRow) {
    const newQty = editValues[row.product_id];
    if (newQty === undefined || newQty === row.on_hand) {
      cancelEdit();
      return;
    }

    // If product has multiple locations, distribute the difference proportionally
    // For a single location, just update directly
    if (row.locations.length === 0) {
      cancelEdit();
      return;
    }

    try {
      setSaving(true);

      if (row.locations.length === 1) {
        // Single location: update directly
        const loc = row.locations[0];
        const res = await fetch(`/api/stock/${loc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: newQty,
            product_id: row.product_id,
            location_id: loc.location?.id ?? '',
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update stock');
        }
      } else {
        // Multiple locations: apply difference to the first location
        const difference = newQty - row.on_hand;
        const primaryLoc = row.locations[0];
        const newLocQty = primaryLoc.quantity + difference;

        const res = await fetch(`/api/stock/${primaryLoc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: newLocQty,
            product_id: row.product_id,
            location_id: primaryLoc.location?.id ?? '',
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update stock');
        }
      }

      toast.success('Stock updated successfully');
      cancelEdit();
      fetchStock(search);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update stock'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleExportCSV() {
    exportToCSV('stock', ['Product', 'SKU', 'Unit Cost', 'On Hand', 'Free to Use', 'Locations'], stockRows.map((r) => [r.product?.name ?? '', r.product?.sku ?? '', String(r.product?.cost_per_unit ?? 0), String(r.on_hand), String(r.free_to_use), r.locations.map((l) => `${l.location?.short_code ?? l.location?.name ?? ''}:${l.quantity}`).join('; ')]));
  }

  // ── Render ──
  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page header */}
      <PageHeader icon={BarChart3} title="Stock" subtitle="Current inventory levels across all warehouses">
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={stockRows.length === 0}>
          <Download className="size-4" />
          Export
        </Button>
      </PageHeader>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by product name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stock table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-muted-foreground">SKU</TableHead>
              <TableHead className="text-right text-muted-foreground">Per Unit Cost</TableHead>
              <TableHead className="text-right text-muted-foreground">On Hand</TableHead>
              <TableHead className="text-right text-muted-foreground">Free to Use</TableHead>
              <TableHead className="text-muted-foreground">Locations</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : stockRows.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="size-10 opacity-40" />
                    <p className="text-sm">No stock records found</p>
                    {search && (
                      <p className="text-xs">
                        Try adjusting your search query
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              stockRows.map((row) => {
                const product = row.product;
                if (!product) return null;

                const isLow = row.on_hand <= product.reorder_level;
                const isEditing = editingId === row.product_id;

                return (
                  <TableRow key={row.product_id} className="border-border">
                    {/* Product Name */}
                    <TableCell className="font-medium text-foreground">
                      {product.name}
                    </TableCell>

                    {/* SKU */}
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {product.sku}
                    </TableCell>

                    {/* Per Unit Cost */}
                    <TableCell className="text-right text-muted-foreground">
                      {currencyFmt.format(product.cost_per_unit)}
                    </TableCell>

                    {/* On Hand */}
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editValues[row.product_id] ?? row.on_hand}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              [row.product_id]: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="ml-auto h-7 w-20 text-right font-mono"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(row);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      ) : (
                        <span
                          className={`font-mono ${
                            isLow
                              ? 'font-bold text-red-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {row.on_hand}
                        </span>
                      )}
                    </TableCell>

                    {/* Free to Use */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {row.free_to_use}
                    </TableCell>

                    {/* Locations */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.locations.map((loc) => (
                          <Badge
                            key={loc.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {loc.location?.short_code ?? loc.location?.name ?? 'Unknown'}
                            :{loc.quantity}
                          </Badge>
                        ))}
                        {row.locations.length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            No locations
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {canEditStock && (
                        isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-emerald-400 hover:text-emerald-300"
                              onClick={() => saveEdit(row)}
                              disabled={saving}
                            >
                              <Check className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => startEdit(row.product_id, row.on_hand)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        )
                      )}
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
