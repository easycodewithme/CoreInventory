'use client';

import { useEffect, useState } from 'react';
import { Bell, FileInput, Truck, RefreshCw, ArrowRightLeft, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface MoveEvent {
  id: string;
  type: string;
  reference: string;
  quantity: number;
  product?: { name?: string };
  created_at: string;
}

const typeIcons: Record<string, React.ElementType> = {
  RECEIPT: FileInput,
  DELIVERY: Truck,
  ADJUSTMENT: RefreshCw,
  TRANSFER: ArrowRightLeft,
};

const typeColors: Record<string, string> = {
  RECEIPT: 'text-emerald-400',
  DELIVERY: 'text-blue-400',
  ADJUSTMENT: 'text-amber-400',
  TRANSFER: 'text-purple-400',
};

export function NotificationDropdown() {
  const [events, setEvents] = useState<MoveEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/moves');
        if (res.ok) {
          const data = await res.json();
          const recent = data.slice(0, 15);
          setEvents(recent);
          setUnreadCount(Math.min(recent.length, 5));
        }
      } catch { /* ignore */ }
    }
    fetchEvents();
  }, []);

  function markAllRead() {
    setUnreadCount(0);
  }

  function getEventText(event: MoveEvent) {
    const productName = event.product?.name || 'Unknown';
    const qty = Math.abs(event.quantity);
    switch (event.type) {
      case 'RECEIPT': return `Received ${qty} x ${productName}`;
      case 'DELIVERY': return `Shipped ${qty} x ${productName}`;
      case 'ADJUSTMENT': return `Adjusted ${productName} by ${event.quantity > 0 ? '+' : ''}${event.quantity}`;
      case 'TRANSFER': return `Transferred ${qty} x ${productName}`;
      default: return `${event.type} - ${productName}`;
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-[320px]">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {events.map((event, i) => {
                const Icon = typeIcons[event.type] || RefreshCw;
                const color = typeColors[event.type] || 'text-muted-foreground';
                return (
                  <div
                    key={event.id || i}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50 ${i < unreadCount ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground leading-tight">{getEventText(event)}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-mono">{event.reference}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
