'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import {
  STAFF_NAVIGATION,
  STUDENT_NAVIGATION,
  type NavSection,
} from '@/config/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Logo } from '../Logo/Logo';
import { SidebarItem } from './SidebarItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMobileSidebar } from './MobileSidebarContext';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { has, hasAny, isStudent } = usePermissions();
  const { isOpen, close } = useMobileSidebar();

  const sections = useMemo<NavSection[]>(() => {
    const nav = isStudent ? STUDENT_NAVIGATION : STAFF_NAVIGATION;

    return nav
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.requiredPermissions && item.requiredPermissions.length > 0) {
            return item.requiredPermissions.every((p) => has(p));
          }
          if (item.requireAny && item.requireAny.length > 0) {
            return hasAny(...item.requireAny);
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [has, hasAny, isStudent]);

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          // Base
          'flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface',
          // Mobile: fixed drawer that slides in
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static positioning, always visible
          'lg:relative lg:translate-x-0 lg:z-auto',
          className,
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Logo size="md" />
          {/* Close button — mobile only */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={close}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-6 px-3 py-4">
            {sections.map((section, i) => (
              <div key={i} className="flex flex-col gap-1">
                {section.label && (
                  <p className="mb-1 px-3 text-xxs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </p>
                )}
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}