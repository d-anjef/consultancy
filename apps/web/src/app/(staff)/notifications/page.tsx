'use client';

import { useState } from 'react';
import { formatDistance } from 'date-fns';
import { Bell, Check, CheckCheck, Circle } from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'border-l-destructive',
  HIGH: 'border-l-destructive/60',
  NORMAL: 'border-l-accent',
  LOW: 'border-l-muted-foreground/30',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page);
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const notifications = data?.items ?? [];
  const unreadCount = unreadData?.count ?? 0;

  function handleClick(notif: typeof notifications[0]) {
    if (!notif.isRead) {
      markRead.mutate(notif.id);
    }
    if (notif.metadata?.deepLink) {
      router.push(notif.metadata.deepLink);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            isLoading={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You'll see notifications here when things happen in the system."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'cursor-pointer border-l-4 transition-colors hover:bg-secondary/50',
                PRIORITY_COLORS[n.priority] ?? 'border-l-border',
                !n.isRead && 'bg-accent-light/20',
              )}
              onClick={() => handleClick(n)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {n.isRead ? (
                      <Check className="h-4 w-4 text-muted-foreground/50" />
                    ) : (
                      <Circle className="h-4 w-4 fill-accent text-accent" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={cn(
                          'text-sm',
                          n.isRead
                            ? 'font-normal text-muted-foreground'
                            : 'font-semibold text-foreground',
                        )}
                      >
                        {n.title}
                      </h3>
                      <Badge variant="outline" className="text-xxs shrink-0">
                        {n.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="mt-1 text-xxs text-muted-foreground">
                      {formatDistance(new Date(n.createdAt), new Date(), {
                        addSuffix: true,
                      })}
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