'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, BarChart3, FileInput, Truck, RefreshCw,
  History, Factory, MapPin, Settings, Plus, Search, TrendingUp,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useAppStore } from '@/lib/store';

interface SearchResult {
  id: string;
  name: string;
  sku: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Debounced product search
  useEffect(() => {
    if (!search || search.length < 2) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.slice(0, 5).map((p: { id: string; name: string; sku: string }) => ({
            id: p.id, name: p.name, sku: p.sku,
          })));
        }
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const go = useCallback((path: string) => {
    setCommandPaletteOpen(false);
    setSearch('');
    router.push(path);
  }, [router, setCommandPaletteOpen]);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput
        placeholder="Search products, navigate, or take an action..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {products.length > 0 && (
          <CommandGroup heading="Products">
            {products.map((p) => (
              <CommandItem key={p.id} onSelect={() => go('/products')}>
                <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{p.name}</span>
                <CommandShortcut>{p.sku}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go('/products')}>
            <Package className="mr-2 h-4 w-4" />
            Products
          </CommandItem>
          <CommandItem onSelect={() => go('/stock')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Stock
          </CommandItem>
          <CommandItem onSelect={() => go('/receipts')}>
            <FileInput className="mr-2 h-4 w-4" />
            Receipts
          </CommandItem>
          <CommandItem onSelect={() => go('/deliveries')}>
            <Truck className="mr-2 h-4 w-4" />
            Deliveries
          </CommandItem>
          <CommandItem onSelect={() => go('/adjustments')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Adjustments
          </CommandItem>
          <CommandItem onSelect={() => go('/history')}>
            <History className="mr-2 h-4 w-4" />
            Move History
          </CommandItem>
          <CommandItem onSelect={() => go('/reports')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Reports
          </CommandItem>
          <CommandItem onSelect={() => go('/warehouse')}>
            <Factory className="mr-2 h-4 w-4" />
            Warehouses
          </CommandItem>
          <CommandItem onSelect={() => go('/locations')}>
            <MapPin className="mr-2 h-4 w-4" />
            Locations
          </CommandItem>
          <CommandItem onSelect={() => go('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => go('/receipts')}>
            <Plus className="mr-2 h-4 w-4 text-emerald-400" />
            New Receipt
          </CommandItem>
          <CommandItem onSelect={() => go('/deliveries')}>
            <Plus className="mr-2 h-4 w-4 text-blue-400" />
            New Delivery
          </CommandItem>
          <CommandItem onSelect={() => go('/adjustments')}>
            <Plus className="mr-2 h-4 w-4 text-amber-400" />
            New Adjustment
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
