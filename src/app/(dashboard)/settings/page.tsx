'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, User, Building2, Bell, Database } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { toast } from 'sonner';

interface CompanySettings {
  company_name: string;
  address: string;
  currency: string;
}

const DEFAULT_SETTINGS: CompanySettings = {
  company_name: 'CoreInventory Inc.',
  address: '',
  currency: 'INR',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState({
    low_stock_alerts: true,
    receipt_updates: true,
    delivery_updates: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('company_settings');
    if (saved) setSettings(JSON.parse(saved));
    const savedNotifs = localStorage.getItem('notification_prefs');
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
  }, []);

  function saveCompanySettings() {
    localStorage.setItem('company_settings', JSON.stringify(settings));
    toast.success('Company settings saved');
  }

  function saveNotificationPrefs() {
    localStorage.setItem('notification_prefs', JSON.stringify(notifications));
    toast.success('Notification preferences saved');
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <PageHeader icon={Settings} title="Settings" subtitle="Manage your application preferences" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="size-4 text-primary" />
              Company Profile
            </CardTitle>
            <CardDescription>Basic company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Enter company address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              />
            </div>
            <Button onClick={saveCompanySettings} size="sm">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Bell className="size-4 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'low_stock_alerts' as const, label: 'Low Stock Alerts', desc: 'Get notified when products fall below reorder level' },
              { key: 'receipt_updates' as const, label: 'Receipt Updates', desc: 'Get notified on receipt status changes' },
              { key: 'delivery_updates' as const, label: 'Delivery Updates', desc: 'Get notified on delivery status changes' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[item.key] ? 'bg-primary' : 'bg-secondary'}`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition-transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            ))}
            <Button onClick={saveNotificationPrefs} size="sm">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* User Profile Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User className="size-4 text-primary" />
              User Profile
            </CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/profile">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Database className="size-4 text-primary" />
              Data Management
            </CardTitle>
            <CardDescription>Export and manage your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Export feature coming soon')}
            >
              Export All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
