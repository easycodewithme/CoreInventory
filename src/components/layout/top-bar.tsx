'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from '@/components/layout/notification-dropdown';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatSegment(segment: string): string {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TopBar() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);

  // Build breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    return { label: formatSegment(segment), href };
  });

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border',
        'bg-background/80 px-6 backdrop-blur-xl'
      )}
    >
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.length === 0 ? (
          <span className="text-muted-foreground">Home</span>
        ) : (
          breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={crumb.href} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="size-3.5 text-muted-foreground/50" />
                )}
                {isLast ? (
                  <span className="font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Right: Search + Notifications + Date + User avatar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => useAppStore.getState().setCommandPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex"
        >
          <Search className="size-3.5" />
          <span>Search...</span>
          <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </button>
        <NotificationDropdown />
        <span className="hidden text-sm text-muted-foreground lg:block">
          {today}
        </span>
        {user && (
          <Avatar size="sm">
            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
            <AvatarFallback className="text-[10px]">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}
