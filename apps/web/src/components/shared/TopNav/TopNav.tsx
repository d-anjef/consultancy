'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/shared/UserMenu/UserMenu';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useMobileSidebar } from '@/components/shared/Sidebar/MobileSidebarContext';

export function TopNav() {
  const router = useRouter();
  const { data } = useUnreadCount();
  const unreadCount = data?.count ?? 0;
  const { toggle } = useMobileSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:gap-4 md:px-6">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={toggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search — hidden on very small screens, visible from sm up */}
      <div className="relative flex-1 max-w-xl hidden sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search students, applications, documents…"
          className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
        />
      </div>

      {/* Spacer on mobile to push actions right */}
      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-1 shrink-0">
        {/* Search icon — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.push('/notifications')}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-xxs font-semibold text-accent-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        <UserMenu />
      </div>
    </header>
  );
}