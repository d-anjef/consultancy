'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  UserPlus,
  FileText,
  Wallet,
  ClipboardCheck,
  CalendarClock,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'page' | 'student' | 'lead' | 'application';
  label: string;
  description?: string;
  href: string;
  icon: React.ElementType;
}

// Quick page navigation
const QUICK_PAGES: SearchResult[] = [
  { id: 'dash', type: 'page', label: 'Dashboard', href: '/dashboard', icon: GraduationCap },
  { id: 'stu', type: 'page', label: 'Students', href: '/students', icon: Users },
  { id: 'lead', type: 'page', label: 'Leads', href: '/leads', icon: UserPlus },
  { id: 'app', type: 'page', label: 'Applications', href: '/applications', icon: FileText },
  { id: 'doc', type: 'page', label: 'Documents', href: '/documents', icon: ClipboardCheck },
  { id: 'fin', type: 'page', label: 'Finance', href: '/finance', icon: Wallet },
  { id: 'coun', type: 'page', label: 'Counseling', href: '/counseling', icon: CalendarClock },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset when opened/closed
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Filter results based on query
  const results = query.trim()
    ? QUICK_PAGES.filter((p) =>
        p.label.toLowerCase().includes(query.toLowerCase()),
      )
    : QUICK_PAGES;

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onOpenChange(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex, router, onOpenChange]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, students, leads…"
            autoFocus
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-xxs font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                No results for "{query}"
              </p>
            </div>
          ) : (
            <>
              <p className="px-3 py-1.5 text-xxs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Navigation
              </p>
              {results.map((result, idx) => {
                const Icon = result.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      isSelected
                        ? 'bg-accent-light text-foreground'
                        : 'hover:bg-secondary',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {result.label}
                      </p>
                    </div>
                    {isSelected && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-4 py-2.5 text-xxs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5">
                ↵
              </kbd>
              Select
            </span>
          </div>
          <span>Chiba Global Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}