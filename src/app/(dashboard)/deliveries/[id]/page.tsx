'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Upload, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Delivery, Product, Location } from '@/lib/types';

interface StockGroup {
  product_id: string;
  on_hand: number;
  free_to_use: number;
  locations: Array<{
    id: string;
    location: { id: string; name: string; short_code: string } | null;
    quantity: number;
  }>;
}
import { STATUS_COLORS } from '@/lib/types';
import { usePermission } from '@/lib/store';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toInputDate(date: string): string {
  return new Date(date).toISOString().split('T')[0];
}

interface LocalItem {
  id: string;
  product_id: string;
  product?: Product;
  demand_qty: number;
  shipped_qty: number;
}

export default function DeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const canValidate = usePermission('deliveries:validate');
  const canDelete = usePermission('deliveries:delete');

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  // Form state
  const [date, setDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LocalItem[]>([]);

  // Lookup data
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockData, setStockData] = useState<StockGroup[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const fetchDelivery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deliveries/${id}`);
      if (!res.ok) throw new Error('Failed to fetch delivery');
      const data: Delivery = await res.json();
      setDelivery(data);

      // Populate form
      setDate(toInputDate(data.date));
      setCustomerName(data.customer_name || '');
      setSourceLocationId(data.source_location_id || '');
      setNotes(data.notes || '');
      setItems(
        (data.delivery_items ?? []).map((item) => ({
          id: item.id,
          product_id: item.product_id,
          product: item.product,
          demand_qty: item.demand_qty,
          shipped_qty: item.shipped_qty,
        }))
      );

      if (data.status === 'DONE' || data.status === 'CANCELLED') {
        setReadOnly(true);
      }
    } catch (err) {
      toast.error('Failed to load delivery');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      if (!res.ok) return;
      const data = await res.json();
      setLocations(data);
    } catch {
      // silent
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const searchParam = productSearch ? `?search=${encodeURIComponent(productSearch)}` : '';
      const res = await fetch(`/api/products${searchParam}`);
      if (!res.ok) return;
      const data = await res.json();
      setProducts(data);
    } catch {
      // silent
    }
  }, [productSearch]);

  const fetchStock = useCallback(async () => {
    try {
      const res = await fetch('/api/stock');
      if (!res.ok) return;
      const raw = await res.json();
      // Flatten: extract per-location quantities from the grouped response
      const flattened: StockGroup[] = (raw ?? []).map((g: Record<string, unknown>) => ({
        product_id: g.product_id as string,
        on_hand: (g.on_hand as number) ?? 0,
        free_to_use: (g.free_to_use as number) ?? 0,
        locations: ((g.locations as Array<Record<string, unknown>>) ?? []).map((l) => ({
          id: l.id as string,
          location: l.location as { id: string; name: string; short_code: string } | null,
          quantity: (l.quantity as number) ?? 0,
        })),
      }));
      setStockData(flattened);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchDelivery();
    fetchLocations();
    fetchStock();
  }, [fetchDelivery, fetchLocations, fetchStock]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function getAvailableStock(productId: string): number {
    const entry = stockData.find((s) => s.product_id === productId);
    if (!entry) return 0;
    if (sourceLocationId) {
      const locStock = entry.locations.find((l) => l.location?.id === sourceLocationId);
      return locStock?.quantity ?? 0;
    }
    return entry.on_hand;
  }

  function handleAddProduct() {
    if (!selectedProductId) return;
    if (items.some((item) => item.product_id === selectedProductId)) {
      toast.error('Product already added');
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        product_id: product.id,
        product,
        demand_qty: 1,
        shipped_qty: 0,
      },
    ]);
    setSelectedProductId('');
    setProductSearch('');
  }

  function handleRemoveItem(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  function handleItemChange(
    itemId: string,
    field: 'demand_qty' | 'shipped_qty',
    value: number
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: Math.max(0, value) } : item
      )
    );
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      const body = {
        date,
        customer_name: customerName,
        source_location_id: sourceLocationId || null,
        notes: notes || null,
        items: items.map((item) => ({
          id: item.id.startsWith('new-') ? undefined : item.id,
          product_id: item.product_id,
          demand_qty: item.demand_qty,
          shipped_qty: item.shipped_qty,
        })),
      };
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      toast.success('Delivery saved successfully');
      fetchDelivery();
      fetchStock();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save delivery';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate() {
    if (!sourceLocationId) {
      toast.error('Please select a source location before validating');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one product before validating');
      return;
    }
    setValidating(true);
    try {
      // Save draft first so all form data is persisted
      const saveBody = {
        date,
        customer_name: customerName,
        source_location_id: sourceLocationId || null,
        notes: notes || null,
        items: items.map((item) => ({
          id: item.id.startsWith('new-') ? undefined : item.id,
          product_id: item.product_id,
          demand_qty: item.demand_qty,
          shipped_qty: item.shipped_qty,
        })),
      };
      const saveRes = await fetch(`/api/deliveries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveBody),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'Failed to save before validation');
      }

      // Now validate
      const res = await fetch(`/api/deliveries/${id}/validate`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Validation failed');
      }
      toast.success('Delivery validated and stock shipped');
      setReadOnly(true);
      fetchDelivery();
      fetchStock();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Validation failed';
      toast.error(message);
    } finally {
      setValidating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-muted-foreground">Delivery not found</p>
        <Link href="/deliveries" className="mt-4 text-sm text-indigo-400 hover:underline">
          Back to Deliveries
        </Link>
      </div>
    );
  }

  const filteredProducts = products.filter(
    (p) =>
      !items.some((item) => item.product_id === p.id) &&
      (productSearch === '' ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/deliveries"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Delivery {delivery.reference}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[delivery.status] ?? ''
                }`}
              >
                {delivery.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(delivery.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="individual" className="flex flex-col gap-4">
        <div className="flex justify-center">
          <TabsList className="rounded-full bg-secondary/60 p-1">
            <TabsTrigger value="individual" className="rounded-full px-6 py-2 text-sm data-active:bg-primary/20 data-active:text-primary">Individual</TabsTrigger>
            <TabsTrigger value="batch" className="rounded-full px-6 py-2 text-sm data-active:bg-primary/20 data-active:text-primary">Batch</TabsTrigger>
          </TabsList>
        </div>

        {/* Individual Tab */}
        <TabsContent value="individual">
          <div className="space-y-6">
            {/* General Info */}
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Customer Name
                    </label>
                    <Input
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Source Location
                    </label>
                    <Select
                      value={sourceLocationId}
                      onValueChange={(v) => setSourceLocationId(v ?? '')}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} ({loc.short_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Status
                    </label>
                    <div className="flex h-8 items-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[delivery.status] ?? ''
                        }`}
                      >
                        {delivery.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Notes
                    </label>
                    <Textarea
                      placeholder="Add notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={readOnly}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Product Row */}
                {!readOnly && (
                  <div className="flex items-end gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search products by name or SKU..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={selectedProductId}
                      onValueChange={(v) => setSelectedProductId(v ?? '')}
                    >
                      <SelectTrigger className="w-[260px]">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            No products found
                          </div>
                        ) : (
                          filteredProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddProduct} disabled={!selectedProductId}>
                      <Plus className="size-4" />
                      Add
                    </Button>
                  </div>
                )}

                {/* Items Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[120px]">Available</TableHead>
                      <TableHead className="w-[140px]">Qty to Ship</TableHead>
                      <TableHead className="w-[80px]">UoM</TableHead>
                      {!readOnly && <TableHead className="w-[60px]" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={readOnly ? 4 : 5}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No products added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => {
                        const available = getAvailableStock(item.product_id);
                        const insufficient = item.demand_qty > available;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {item.product?.name ?? 'Unknown'}
                                </div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {item.product?.sku ?? ''}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-mono text-sm ${
                                  insufficient
                                    ? 'text-orange-400'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {available}
                              </span>
                              {insufficient && (
                                <div className="mt-0.5 text-[11px] font-medium text-orange-400">
                                  Insufficient stock
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={item.demand_qty}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    'demand_qty',
                                    Number(e.target.value)
                                  )
                                }
                                disabled={readOnly}
                                className={`w-[120px] ${
                                  insufficient
                                    ? 'border-orange-500/50 focus-visible:border-orange-500 focus-visible:ring-orange-500/30'
                                    : ''
                                }`}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.product?.unit_of_measure ?? 'pcs'}
                            </TableCell>
                            {!readOnly && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Footer Buttons */}
            {!readOnly && (
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                {canValidate && (
                  <Button
                    onClick={handleValidate}
                    disabled={validating || items.length === 0}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {validating ? 'Validating...' : 'Validate & Ship'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Batch Tab */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Import</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/20 py-16">
                <Upload className="mb-3 size-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium text-foreground">
                  Upload CSV File
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Upload a CSV with columns: product_sku, demand_qty, shipped_qty
                </p>
                <Button variant="outline" disabled>
                  <Upload className="size-4" />
                  Choose File
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
