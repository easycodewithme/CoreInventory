'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, AlertTriangle } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LocationModal } from '@/components/locations/location-modal';
import type { Location } from '@/lib/types';

// ── Component ──

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLocation, setDeleteLocation] = useState<Location | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch locations ──
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/locations');
      if (!res.ok) throw new Error('Failed to fetch locations');
      const data = await res.json();
      setLocations(data);
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // ── Handlers ──
  function handleAdd() {
    setEditLocation(undefined);
    setModalOpen(true);
  }

  function handleEdit(location: Location) {
    setEditLocation(location);
    setModalOpen(true);
  }

  function handleDeleteClick(e: React.MouseEvent, location: Location) {
    e.stopPropagation();
    setDeleteLocation(location);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteLocation) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/locations/${deleteLocation.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete location');
      }

      toast.success('Location deleted');
      setDeleteOpen(false);
      fetchLocations();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete location'
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleSuccess() {
    fetchLocations();
  }

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Locations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Storage locations within warehouses
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Location
        </Button>
      </div>

      {/* Locations table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Short Code</TableHead>
              <TableHead className="text-muted-foreground">Warehouse</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : locations.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <MapPin className="size-10 opacity-40" />
                    <p className="text-sm">No locations yet</p>
                    <p className="text-xs">
                      Add a location to start organizing inventory
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    {location.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {location.short_code}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {location.warehouse?.name ?? '\u2014'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleEdit(location)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteClick(e, location)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit modal */}
      <LocationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        location={editLocation}
        onSuccess={handleSuccess}
      />

      {/* Delete confirmation dialog */}
      {deleteLocation && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete Location
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                {deleteLocation.name}
              </span>{' '}
              ({deleteLocation.short_code})? This action cannot be undone.
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
