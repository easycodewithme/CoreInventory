'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Package,
  LayoutDashboard,
  FileInput,
  Truck,
  RefreshCw,
  History,
  BarChart3,
  Factory,
  MapPin,
  LogOut,
  ChevronLeft,
  TrendingUp,
  Settings,
  Search,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { hasPermission } from '@/lib/rbac';
import type { Permission } from '@/lib/rbac';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: 'receipts' | 'deliveries' | 'lowStock';
  permission?: Permission;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Receipts', href: '/receipts', icon: FileInput, badge: 'receipts' },
      { label: 'Deliveries', href: '/deliveries', icon: Truck, badge: 'deliveries' },
      { label: 'Inventory Adjustment', href: '/adjustments', icon: RefreshCw, permission: 'adjustments:create' },
      { label: 'Move History', href: '/history', icon: History },
    ],
  },
  {
    title: 'INVENTORY',
    items: [
      { label: 'Products', href: '/products', icon: Package },
      { label: 'Stock', href: '/stock', icon: BarChart3, badge: 'lowStock' },
      { label: 'Reports', href: '/reports', icon: TrendingUp },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { label: 'Warehouse', href: '/warehouse', icon: Factory, permission: 'warehouses:manage' },
      { label: 'Locations', href: '/locations', icon: MapPin, permission: 'locations:manage' },
      { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings:manage' },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'User Management', href: '/admin/users', icon: UserCog, permission: 'users:manage' },
    ],
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar, user, setUser, pendingReceiptsCount, pendingDeliveriesCount, lowStockCount, setPendingReceiptsCount, setPendingDeliveriesCount, setLowStockCount, setCommandPaletteOpen } = useAppStore();

  // Fetch badge counts
  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/counts');
        if (res.ok) {
          const data = await res.json();
          setPendingReceiptsCount(data.pending_receipts ?? 0);
          setPendingDeliveriesCount(data.pending_deliveries ?? 0);
          setLowStockCount(data.low_stock_count ?? 0);
        }
      } catch { /* ignore */ }
    }
    fetchCounts();
  }, [setPendingReceiptsCount, setPendingDeliveriesCount, setLowStockCount]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            avatar_url: profile.avatar_url,
          });
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email ?? '',
            full_name: authUser.user_metadata?.full_name ?? authUser.email ?? '',
            role: 'STAFF',
            avatar_url: null,
          });
        }
      }
    }

    fetchUser();
  }, [setUser]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/sign-in');
  }

  return (
    <aside
      className={cn(
        'group/sidebar relative flex h-screen flex-col border-r border-border bg-sidebar',
        'transition-[width] duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border px-4',
          sidebarCollapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-secondary"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Package className="size-5 text-primary" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground">
              CoreInventory
            </span>
          )}
        </button>
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>

      {/* Search trigger */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-3">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Search className="size-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 overflow-hidden">
        <nav className="flex flex-col gap-1 p-3">
          {navSections.map((section, sectionIdx) => {
            const userRole = user?.role;
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(userRole, item.permission)
            );
            if (visibleItems.length === 0) return null;
            return (
            <div key={section.title}>
              {sectionIdx > 0 && (
                <Separator className="my-3" />
              )}
              {!sidebarCollapsed && (
                <span className="mb-2 block px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.title}
                </span>
              )}
              {sidebarCollapsed && sectionIdx > 0 && (
                <div className="my-1" />
              )}
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/');
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        'group/nav-item relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        sidebarCollapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-sidebar-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      {/* Active accent bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <Icon
                        className={cn(
                          'size-[18px] shrink-0',
                          isActive
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover/nav-item:text-foreground'
                        )}
                      />
                      {!sidebarCollapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge === 'receipts' && pendingReceiptsCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/20 px-1.5 text-[10px] font-semibold text-primary">
                              {pendingReceiptsCount}
                            </span>
                          )}
                          {item.badge === 'deliveries' && pendingDeliveriesCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/20 px-1.5 text-[10px] font-semibold text-primary">
                              {pendingDeliveriesCount}
                            </span>
                          )}
                          {item.badge === 'lowStock' && lowStockCount > 0 && (
                            <span className="ml-auto flex size-2 rounded-full bg-red-500" />
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger render={<div />}>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12}>
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <div key={item.href}>
                      {linkContent}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom user section */}
      <div className="shrink-0 border-t border-border p-3">
        {user ? (
          <div
            className={cn(
              'flex items-center gap-3',
              sidebarCollapsed && 'flex-col gap-2'
            )}
          >
            <Avatar size="sm">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="text-[10px]">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {user.full_name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.role}
                </span>
              </div>
            )}
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleSignOut}
                      className="text-muted-foreground hover:text-destructive"
                    />
                  }
                >
                  <LogOut className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Sign out
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSignOut}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-4" />
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-3',
              sidebarCollapsed && 'justify-center'
            )}
          >
            <div className="size-6 animate-pulse rounded-full bg-secondary" />
            {!sidebarCollapsed && (
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
                <div className="h-2 w-16 animate-pulse rounded bg-secondary" />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
