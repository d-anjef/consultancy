'use client';

import { Settings, Building2, Globe, Wallet, Clock, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { siteConfig } from '@/config/site';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System configuration and organization settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Name" value={siteConfig.organization.name} />
            <InfoRow label="Short Name" value={siteConfig.organization.shortName} />
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Localization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Timezone" value={siteConfig.organization.timezone} />
            <InfoRow label="Currency" value={siteConfig.organization.currency} />
            <InfoRow label="Locale" value={siteConfig.organization.locale} />
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="App URL" value={siteConfig.url} />
            <InfoRow label="API URL" value={siteConfig.api.baseUrl} />
            <InfoRow label="Environment" value={process.env.NEXT_PUBLIC_APP_ENV ?? 'development'} />
          </CardContent>
        </Card>

        {/* Current User */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Current Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow
              label="Logged in as"
              value={`${user?.profile.firstName} ${user?.profile.lastName}`}
            />
            <InfoRow label="Email" value={user?.email ?? '—'} />
            <InfoRow label="Role" value={user?.role.displayName ?? '—'} />
            <InfoRow label="Branch" value={user?.branch?.name ?? 'Organization-wide'} />
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Permissions
              </span>
              <p className="mt-0.5 text-foreground font-medium tabular-nums">
                {user?.role.permissions.length ?? 0} active
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-accent/30 bg-accent-light">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-foreground">
            <p className="font-medium">Advanced Settings</p>
            <p className="mt-1 text-muted-foreground">
              Organization name, timezone, and currency are configured via environment
              variables. To change these, update the .env file and restart the server.
              Future versions will support in-app configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}