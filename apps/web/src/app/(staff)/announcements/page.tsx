'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateAnnouncementDialog } from '@/components/announcements/CreateAnnouncementDialog';
import { Plus, Megaphone, Mail, Bell, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  category: 'HOLIDAY' | 'EVENT' | 'NOTICE' | 'GENERAL';
  audience: string;
  sendEmail: boolean;
  sendInApp: boolean;
  status: 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentBy: { firstName: string; lastName: string };
  sentAt?: string;
  createdAt: string;
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  HOLIDAY: { label: 'Holiday', icon: '🎉', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  EVENT: { label: 'Event', icon: '📅', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  NOTICE: { label: 'Notice', icon: '📢', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  GENERAL: { label: 'General', icon: '💬', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const AUDIENCE_LABELS: Record<string, string> = {
  ALL_USERS: 'All Users',
  ALL_STUDENTS: 'All Students',
  ALL_STAFF: 'All Staff',
  BY_BRANCH: 'By Branch',
  BY_ROLE: 'By Role',
};

export default function AnnouncementsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await api.get('/announcements?limit=50');
      const payload = res?.data ?? res;
      return payload as { data: Announcement[] };
    },
  });

  const announcements: Announcement[] = data?.data ?? [];

  const stats = {
    total: announcements.length,
    sent: announcements.filter((a) => a.status === 'SENT').length,
    sending: announcements.filter((a) => a.status === 'SENDING').length,
    failed: announcements.filter((a) => a.status === 'FAILED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Send broadcast messages to students and staff
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="TOTAL" value={stats.total} />
        <StatCard label="SENT" value={stats.sent} accent="text-green-600" />
        <StatCard label="SENDING" value={stats.sending} accent="text-blue-600" />
        <StatCard label="FAILED" value={stats.failed} accent="text-red-600" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Megaphone className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">No announcements yet</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Send holiday greetings, events, or important notices to users.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Send First Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}

      <CreateAnnouncementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-gray-500 font-medium tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${accent ?? 'text-gray-900'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function AnnouncementCard({ announcement: a }: { announcement: Announcement }) {
  const meta = CATEGORY_META[a.category] ?? CATEGORY_META.GENERAL;
  const successRate = a.recipientCount > 0
    ? Math.round((a.sentCount / a.recipientCount) * 100)
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${meta.color} border`}>
              <span className="mr-1">{meta.icon}</span>
              {meta.label}
            </Badge>
            <StatusBadge status={a.status} />
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {AUDIENCE_LABELS[a.audience] ?? a.audience}
            </Badge>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 text-lg">{a.title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2 whitespace-pre-line">
          {a.message}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              Sent by{' '}
              <strong className="text-gray-700">
                {a.sentBy.firstName} {a.sentBy.lastName}
              </strong>
            </span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {a.sendInApp && (
              <span className="flex items-center gap-1 text-gray-600">
                <Bell className="w-3 h-3" /> In-app
              </span>
            )}
            {a.sendEmail && (
              <span className="flex items-center gap-1 text-gray-600">
                <Mail className="w-3 h-3" /> Email
              </span>
            )}
            <span className="font-semibold text-gray-900">
              {a.sentCount}/{a.recipientCount}
              {a.status === 'SENT' && ` (${successRate}%)`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    DRAFT: {
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: null,
      label: 'Draft',
    },
    SENDING: {
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
      label: 'Sending',
    },
    SENT: {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
      label: 'Sent',
    },
    FAILED: {
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: <AlertCircle className="w-3 h-3 mr-1" />,
      label: 'Failed',
    },
  };

  const cfg = map[status] ?? map.DRAFT;
  return (
    <Badge className={`${cfg.color} border flex items-center`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}