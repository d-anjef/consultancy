'use client';

import { useState } from 'react';
import { formatDistance } from 'date-fns';
import { Bell, Check, CheckCheck, Circle } from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { cn } from '@/lib/utils';

export default function StudentNotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page);
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const notifications = data?.items ?? [];
  const unreadCount = unreadData?.count ?? 0;

  function handleClick(notif: typeof notifications[0]) {
    if (!notif.isRead) markRead.mutate(notif.id);
    if (notif.metadata?.deepLink) router.push(notif.metadata.deepLink);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">My Account</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} isLoading={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading…" />
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-secondary/50',
                !n.isRead && 'bg-accent-light/20',
              )}
              onClick={() => handleClick(n)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {n.isRead ? (
                    <Check className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 fill-accent text-accent mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className={cn('text-sm', n.isRead ? 'text-muted-foreground' : 'font-semibold text-foreground')}>
                      {n.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xxs text-muted-foreground mt-1">
                      {formatDistance(new Date(n.createdAt), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}