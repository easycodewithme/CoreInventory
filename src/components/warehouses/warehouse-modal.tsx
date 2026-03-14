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
import type { Warehouse } from '@/lib/types';

// ── Props ──

interface WarehouseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse;
  onSuccess: () => void;
}

// ── Component ──

export function WarehouseModal({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: WarehouseModalProps) {
  const isEdit = !!warehouse;

  // Form state
  const [name, setName] = useState('');
  const [mainPolicy, setMainPolicy] = useState<'FIFO' | 'LIFO' | 'FEFO'>('FIFO');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (open && warehouse) {
      setName(warehouse.name);
      setMainPolicy(warehouse.main_policy);
      setAddress(warehouse.address ?? '');
    } else if (open && !warehouse) {
      setName('');
      setMainPolicy('FIFO');
      setAddress('');
    }
  }, [open, warehouse]);

  // ── Submit handler ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Warehouse name is required');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        main_policy: mainPolicy,
        address: address.trim() || null,
      };

      const url = isEdit ? `/api/warehouses/${warehouse.id}` : '/api/warehouses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save warehouse');
      }

      toast.success(isEdit ? 'Warehouse updated' : 'Warehouse created');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save warehouse'
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
            {isEdit ? 'Edit Warehouse' : 'Add Warehouse'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="warehouse-name"
              placeholder="e.g. Main Warehouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Policy */}
          <div className="space-y-1.5">
            <Label>Policy</Label>
            <Select
              value={mainPolicy}
              onValueChange={(v) => setMainPolicy((v ?? 'FIFO') as 'FIFO' | 'LIFO' | 'FEFO')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIFO">FIFO (First In, First Out)</SelectItem>
                <SelectItem value="LIFO">LIFO (Last In, First Out)</SelectItem>
                <SelectItem value="FEFO">FEFO (First Expired, First Out)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-address">Address</Label>
            <Textarea
              id="warehouse-address"
              placeholder="Enter warehouse address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
                  : 'Create Warehouse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
