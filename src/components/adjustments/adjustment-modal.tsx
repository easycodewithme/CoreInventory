'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDownIcon } from 'lucide-react';
import type { Product, Location } from '@/lib/types';

// ── Props ──

interface AdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ── Component ──

export function AdjustmentModal({
  open,
  onOpenChange,
  onSuccess,
}: AdjustmentModalProps) {
  // Form state
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [countedQty, setCountedQty] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Product search
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // Fetch products and locations when modal opens
  useEffect(() => {
    if (!open) return;

    async function loadProducts() {
      try {
        setProductsLoading(true);
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
      } catch {
        toast.error('Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    }

    async function loadLocations() {
      try {
        setLocationsLoading(true);
        const res = await fetch('/api/locations');
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        setLocations(data);
      } catch {
        toast.error('Failed to load locations');
      } finally {
        setLocationsLoading(false);
      }
    }

    loadProducts();
    loadLocations();
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setProductId('');
      setLocationId('');
      setCountedQty('');
      setReason('');
      setProductSearch('');
    }
  }, [open]);

  // Selected product
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  // Live difference calculation
  const currentOnHand = selectedProduct?.on_hand ?? 0;
  const counted = countedQty !== '' ? parseFloat(countedQty) : null;
  const difference = counted !== null ? counted - currentOnHand : null;

  // ── Submit handler ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productId) {
      toast.error('Please select a product');
      return;
    }

    if (countedQty === '' || isNaN(parseFloat(countedQty))) {
      toast.error('Please enter a valid physical count');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        product_id: productId,
        location_id: locationId || null,
        counted_qty: parseFloat(countedQty),
        reason: reason.trim(),
      };

      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create adjustment');
      }

      toast.success('Adjustment applied successfully');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to apply adjustment'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Stock Adjustment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product (searchable) */}
          <div className="space-y-1.5">
            <Label>
              Product <span className="text-destructive">*</span>
            </Label>
            <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
              <PopoverTrigger
                className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors hover:bg-input/50 dark:bg-input/30"
              >
                <span className={selectedProduct ? 'text-foreground' : 'text-muted-foreground'}>
                  {selectedProduct
                    ? `${selectedProduct.name} (Current: ${selectedProduct.on_hand ?? 0})`
                    : 'Select a product...'}
                </span>
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent className="w-[--anchor-width] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search products..."
                    value={productSearch}
                    onValueChange={setProductSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {productsLoading ? 'Loading...' : 'No products found'}
                    </CommandEmpty>
                    <CommandGroup>
                      {products.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.name} ${product.sku}`}
                          onSelect={() => {
                            setProductId(product.id);
                            setProductSearchOpen(false);
                          }}
                          data-checked={product.id === productId ? 'true' : undefined}
                        >
                          <span className="flex-1 truncate">
                            {product.name}{' '}
                            <span className="text-muted-foreground">
                              (Current: {product.on_hand ?? 0})
                            </span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select
              value={locationId}
              onValueChange={(v) => setLocationId(v ?? '')}
              disabled={locationsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} ({loc.short_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Physical Count */}
          <div className="space-y-1.5">
            <Label htmlFor="counted-qty">
              Physical Count <span className="text-destructive">*</span>
            </Label>
            <Input
              id="counted-qty"
              type="number"
              min="0"
              step="1"
              placeholder="Enter counted quantity"
              value={countedQty}
              onChange={(e) => setCountedQty(e.target.value)}
              required
              className="font-mono"
            />
            {/* Live difference */}
            {selectedProduct && difference !== null && (
              <p
                className={`mt-1 text-sm font-medium font-mono ${
                  difference > 0
                    ? 'text-emerald-400'
                    : difference < 0
                    ? 'text-red-400'
                    : 'text-muted-foreground'
                }`}
              >
                Difference:{' '}
                {difference > 0 ? `+${difference}` : difference === 0 ? '0' : `${difference}`}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              placeholder='e.g. "Damaged goods", "Counting error"'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Applying...' : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
