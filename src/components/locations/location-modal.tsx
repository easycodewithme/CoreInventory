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
import { Button } from '@/components/ui/button';
import type { Location, Warehouse } from '@/lib/types';

// ── Props ──

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location;
  onSuccess: () => void;
}

// ── Component ──

export function LocationModal({
  open,
  onOpenChange,
  location,
  onSuccess,
}: LocationModalProps) {
  const isEdit = !!location;

  // Form state
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Warehouses
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  // Fetch warehouses when modal opens
  useEffect(() => {
    if (!open) return;

    async function loadWarehouses() {
      try {
        setWarehousesLoading(true);
        const res = await fetch('/api/warehouses');
        if (!res.ok) throw new Error('Failed to fetch warehouses');
        const data = await res.json();
        setWarehouses(data);
      } catch {
        toast.error('Failed to load warehouses');
      } finally {
        setWarehousesLoading(false);
      }
    }

    loadWarehouses();
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (open && location) {
      setName(location.name);
      setShortCode(location.short_code);
      setWarehouseId(location.warehouse_id);
    } else if (open && !location) {
      setName('');
      setShortCode('');
      setWarehouseId('');
    }
  }, [open, location]);

  // ── Submit handler ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Location name is required');
      return;
    }

    if (!shortCode.trim()) {
      toast.error('Short code is required');
      return;
    }

    if (!warehouseId) {
      toast.error('Please select a warehouse');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        short_code: shortCode.trim().toUpperCase(),
        warehouse_id: warehouseId,
      };

      const url = isEdit ? `/api/locations/${location.id}` : '/api/locations';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save location');
      }

      toast.success(isEdit ? 'Location updated' : 'Location created');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save location'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Location' : 'Add Location'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="location-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location-name"
              placeholder="e.g. Rack A1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Short Code */}
          <div className="space-y-1.5">
            <Label htmlFor="location-code">
              Short Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location-code"
              placeholder="e.g. RA1"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              required
              className="font-mono uppercase"
            />
          </div>

          {/* Warehouse */}
          <div className="space-y-1.5">
            <Label>
              Warehouse <span className="text-destructive">*</span>
            </Label>
            <Select
              value={warehouseId}
              onValueChange={(v) => setWarehouseId(v ?? '')}
              disabled={warehousesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  : 'Create Location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
