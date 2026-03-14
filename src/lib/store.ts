'use client';

import { create } from 'zustand';
import { hasPermission, type Permission } from '@/lib/rbac';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  lowStockCount: number;
  setLowStockCount: (count: number) => void;
  pendingReceiptsCount: number;
  setPendingReceiptsCount: (count: number) => void;
  pendingDeliveriesCount: number;
  setPendingDeliveriesCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  user: null,
  setUser: (user) => set({ user }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  lowStockCount: 0,
  setLowStockCount: (count) => set({ lowStockCount: count }),
  pendingReceiptsCount: 0,
  setPendingReceiptsCount: (count) => set({ pendingReceiptsCount: count }),
  pendingDeliveriesCount: 0,
  setPendingDeliveriesCount: (count) => set({ pendingDeliveriesCount: count }),
}));

/** Hook: check if current user has a permission */
export function usePermission(permission: Permission): boolean {
  return useAppStore((s) => hasPermission(s.user?.role, permission));
}
