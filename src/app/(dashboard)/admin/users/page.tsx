'use client';

import { useEffect, useState } from 'react';
import { Shield, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/layout/page-header';
import { useAppStore } from '@/lib/store';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

const ROLE_BADGES: Record<string, string> = {
  ADMIN: 'bg-purple-900/50 text-purple-300',
  MANAGER: 'bg-blue-900/50 text-blue-300',
  STAFF: 'bg-zinc-700 text-zinc-200',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const currentUser = useAppStore((s) => s.user);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        toast.error('Access denied — Admin only');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch users');
      setUsers(await res.json());
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdating(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update role');
      }
      toast.success('Role updated');
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <PageHeader icon={UserCog} title="User Management" subtitle="Manage user roles and permissions" />

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-28" />
                </div>
              ))
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Shield className="size-10 opacity-30 mb-2" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <div key={u.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/30">
                    <Avatar>
                      <AvatarFallback className="text-xs">{getInitials(u.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">You</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGES[u.role] ?? ROLE_BADGES.STAFF}`}>
                      {u.role}
                    </span>
                    {isSelf ? (
                      <Button variant="outline" size="sm" disabled className="w-28 text-xs">
                        Can&apos;t edit
                      </Button>
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={(val) => val && handleRoleChange(u.id, val)}
                        disabled={updating === u.id}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="STAFF">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permission reference */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium text-foreground mb-4">Role Permissions Reference</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-900/50 text-purple-300">ADMIN</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Everything a Manager can do</li>
                <li>+ Manage users &amp; assign roles</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-900/50 text-blue-300">MANAGER</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Create, edit, delete products</li>
                <li>Create &amp; validate receipts/deliveries</li>
                <li>Make stock adjustments</li>
                <li>Manage warehouses &amp; locations</li>
                <li>Access reports &amp; settings</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-700 text-zinc-200">STAFF</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>View all inventory data</li>
                <li>Create draft receipts &amp; deliveries</li>
                <li>View reports</li>
                <li>Cannot validate, delete, or edit stock</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
