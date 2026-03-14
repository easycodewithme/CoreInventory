'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Package, Download } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { ProductModal } from '@/components/products/product-modal';
import { DeleteDialog } from '@/components/products/delete-dialog';
import type { Product } from '@/lib/types';
import { PageHeader } from '@/components/layout/page-header';
import { exportToCSV } from '@/lib/csv-export';
import { usePermission } from '@/lib/store';

// ── Helpers ──

const currencyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

// ── Component ──

export default function ProductsPage() {
  const canCreate = usePermission('products:create');
  const canEdit = usePermission('products:edit');
  const canDelete = usePermission('products:delete');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | undefined>(undefined);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch products ──
  const fetchProducts = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const url = query
        ? `/api/products?search=${encodeURIComponent(query)}`
        : '/api/products';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, fetchProducts]);

  // ── Handlers ──
  function handleAddProduct() {
    setEditProduct(undefined);
    setModalOpen(true);
  }

  function handleEditProduct(product: Product) {
    setEditProduct(product);
    setModalOpen(true);
  }

  function handleDeleteProduct(e: React.MouseEvent, product: Product) {
    e.stopPropagation();
    setDeleteProduct(product);
    setDeleteOpen(true);
  }

  function handleSuccess() {
    fetchProducts(search);
  }

  function handleExportCSV() {
    exportToCSV('products', ['SKU', 'Name', 'Category', 'UoM', 'On Hand', 'Cost/Unit', 'Reorder Level'], products.map((p) => [p.sku, p.name, p.category?.name ?? '', p.unit_of_measure, String(p.on_hand ?? 0), String(p.cost_per_unit), String(p.reorder_level)]));
  }

  // ── Render ──
  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page header */}
      <PageHeader icon={Package} title="Products" subtitle={loading ? '...' : `${products.length} products`}>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={products.length === 0}>
          <Download className="size-4" />
          Export
        </Button>
        {canCreate && (
          <Button onClick={handleAddProduct}>
            <Plus className="size-4" />
            Add Product
          </Button>
        )}
      </PageHeader>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Products table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">SKU</TableHead>
              <TableHead className="text-muted-foreground">Product Name</TableHead>
              <TableHead className="text-muted-foreground">Category</TableHead>
              <TableHead className="text-muted-foreground">UoM</TableHead>
              <TableHead className="text-right text-muted-foreground">On Hand</TableHead>
              <TableHead className="text-right text-muted-foreground">Cost/Unit</TableHead>
              <TableHead className="text-right text-muted-foreground">Reorder Level</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="size-10 opacity-40" />
                    <p className="text-sm">No products found</p>
                    {search && (
                      <p className="text-xs">
                        Try adjusting your search query
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const onHand = product.on_hand ?? 0;
                const isLow = onHand <= product.reorder_level;

                return (
                  <TableRow
                    key={product.id}
                    className={`${canEdit ? 'cursor-pointer' : ''} border-border`}
                    onClick={() => canEdit && handleEditProduct(product)}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category?.name ?? '\u2014'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.unit_of_measure}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        isLow
                          ? 'font-semibold text-red-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {onHand}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {currencyFmt.format(product.cost_per_unit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {product.reorder_level}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDeleteProduct(e, product)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Product create/edit modal */}
      <ProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={editProduct}
        onSuccess={handleSuccess}
      />

      {/* Delete confirmation dialog */}
      {deleteProduct && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          product={deleteProduct}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
