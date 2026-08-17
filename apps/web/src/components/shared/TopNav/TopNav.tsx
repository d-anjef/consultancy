'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, X, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/shared/UserMenu/UserMenu';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useMobileSidebar } from '@/components/shared/Sidebar/MobileSidebarContext';
import { GlobalSearchDialog } from './GlobalSearchDialog';

export function TopNav() {
  const router = useRouter();
  const { data } = useUnreadCount();
  const unreadCount = data?.count ?? 0;
  const { toggle } = useMobileSidebar();

  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-3 md:px-6">
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

        {/* ─── Search bar (clickable, opens dialog) ─── */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group relative flex h-9 w-full max-w-md items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 text-sm text-muted-foreground transition-all hover:bg-secondary hover:border-border/80 md:w-96"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">
            Search students, leads, applications…
          </span>
          <kbd className="hidden md:flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xxs font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* ─── Spacer ─── */}
        <div className="flex-1" />

        {/* ─── Right side actions ─── */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={() => router.push('/notifications')}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-xxs font-semibold text-accent-foreground ring-2 ring-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          <UserMenu />
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}