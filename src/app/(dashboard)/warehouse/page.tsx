'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Factory, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { WarehouseModal } from '@/components/warehouses/warehouse-modal';
import type { Warehouse } from '@/lib/types';

// ── Extended warehouse with location count ──

interface WarehouseWithCount extends Warehouse {
  location_count: number;
}

// ── Policy badge colors ──

const POLICY_COLORS: Record<string, string> = {
  FIFO: 'bg-blue-900/50 text-blue-300',
  LIFO: 'bg-amber-900/50 text-amber-300',
  FEFO: 'bg-emerald-900/50 text-emerald-300',
};

// ── Component ──

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWarehouse, setDeleteWarehouse] = useState<WarehouseWithCount | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch warehouses ──
  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/warehouses');
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      const data = await res.json();
      setWarehouses(data);
    } catch {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // ── Handlers ──
  function handleAdd() {
    setEditWarehouse(undefined);
    setModalOpen(true);
  }

  function handleEdit(warehouse: Warehouse) {
    setEditWarehouse(warehouse);
    setModalOpen(true);
  }

  function handleDeleteClick(e: React.MouseEvent, warehouse: WarehouseWithCount) {
    e.stopPropagation();
    setDeleteWarehouse(warehouse);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteWarehouse) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/warehouses/${deleteWarehouse.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete warehouse');
      }

      toast.success('Warehouse deleted');
      setDeleteOpen(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete warehouse'
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleSuccess() {
    fetchWarehouses();
  }

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Warehouses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your warehouse locations
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Warehouse
        </Button>
      </div>

      {/* Warehouses grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Factory className="size-12 text-muted-foreground opacity-40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No warehouses yet. Add your first warehouse to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => {
            const policyClass =
              POLICY_COLORS[warehouse.main_policy] ?? 'bg-zinc-700 text-zinc-200';

            return (
              <Card
                key={warehouse.id}
                className="transition-all duration-200 hover:ring-1 hover:ring-[#2a2a32]"
              >
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-foreground">
                      {warehouse.name}
                    </CardTitle>
                  </div>
                  <span
                    className={`ml-2 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${policyClass}`}
                  >
                    {warehouse.main_policy}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  {warehouse.address ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {warehouse.address}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/50">
                      No address provided
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {warehouse.location_count}{' '}
                      {warehouse.location_count === 1 ? 'location' : 'locations'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleEdit(warehouse)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteClick(e, warehouse)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <WarehouseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        warehouse={editWarehouse}
        onSuccess={handleSuccess}
      />

      {/* Delete confirmation dialog */}
      {deleteWarehouse && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete Warehouse
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                {deleteWarehouse.name}
              </span>
              ? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
