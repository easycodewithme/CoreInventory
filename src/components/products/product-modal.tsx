'use client';

import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Product, Category } from '@/lib/types';
import { UOM_OPTIONS } from '@/lib/types';

// ── Props ──

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSuccess: () => void;
}

// ── Component ──

export function ProductModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductModalProps) {
  const isEdit = !!product;

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('pcs');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (!open) return;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data);
      } catch {
        toast.error('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    }

    loadCategories();
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (open && product) {
      setName(product.name);
      setSku(product.sku);
      setCategoryId(product.category_id ?? '');
      setUnitOfMeasure(product.unit_of_measure);
      setCostPerUnit(String(product.cost_per_unit));
      setReorderLevel(String(product.reorder_level));
      setDescription(product.description ?? '');
    } else if (open && !product) {
      // Reset form for create
      setName('');
      setSku('');
      setCategoryId('');
      setUnitOfMeasure('pcs');
      setCostPerUnit('');
      setReorderLevel('');
      setDescription('');
    }
  }, [open, product]);

  // ── Submit handler ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !sku.trim()) {
      toast.error('Product name and SKU are required');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        category_id: categoryId || null,
        unit_of_measure: unitOfMeasure,
        cost_per_unit: costPerUnit ? parseFloat(costPerUnit) : 0,
        reorder_level: reorderLevel ? parseInt(reorderLevel, 10) : 0,
        description: description.trim() || null,
      };

      const url = isEdit ? `/api/products/${product.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save product');
      }

      toast.success(isEdit ? 'Product updated' : 'Product created');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save product'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-1.5">
            <Label htmlFor="product-name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-name"
              placeholder="e.g. Steel Rod 12mm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* SKU */}
          <div className="space-y-1.5">
            <Label htmlFor="product-sku">
              SKU <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-sku"
              placeholder="e.g. STL-ROD-012"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="font-mono"
            />
          </div>

          {/* Category & UoM row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setCategoryId(v ?? '')}
                disabled={categoriesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    None
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit of Measure */}
            <div className="space-y-1.5">
              <Label>Unit of Measure</Label>
              <Select
                value={unitOfMeasure}
                onValueChange={(v) => setUnitOfMeasure(v ?? 'pcs')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map((uom) => (
                    <SelectItem key={uom} value={uom}>
                      {uom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost & Reorder Level row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Cost Per Unit */}
            <div className="space-y-1.5">
              <Label htmlFor="product-cost">Cost Per Unit</Label>
              <Input
                id="product-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
            </div>

            {/* Reorder Level */}
            <div className="space-y-1.5">
              <Label htmlFor="product-reorder">Reorder Level</Label>
              <Input
                id="product-reorder"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              placeholder="Optional product description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
              {submitting
                ? isEdit
                  ? 'Saving...'
                  : 'Creating...'
                : isEdit
                  ? 'Save Changes'
                  : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
