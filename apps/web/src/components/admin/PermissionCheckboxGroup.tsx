'use client';

import { useMemo } from 'react';
import type { Permission } from '@/lib/api/permissions';
import { cn } from '@/lib/utils';

interface PermissionCheckboxGroupProps {
  category: string;
  permissions: Permission[];
  selectedCodes: Set<string>;
  onToggle: (code: string) => void;
  onSelectAll: (codes: string[]) => void;
  onDeselectAll: (codes: string[]) => void;
  disabled?: boolean;
}

export function PermissionCheckboxGroup({
  category,
  permissions,
  selectedCodes,
  onToggle,
  onSelectAll,
  onDeselectAll,
  disabled = false,
}: PermissionCheckboxGroupProps) {
  const allCodes = useMemo(() => permissions.map((p) => p.code), [permissions]);
  const allSelected = allCodes.every((c) => selectedCodes.has(c));
  const someSelected = allCodes.some((c) => selectedCodes.has(c));
  const selectedCount = allCodes.filter((c) => selectedCodes.has(c)).length;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {category}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            ({selectedCount}/{allCodes.length})
          </span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() =>
              allSelected ? onDeselectAll(allCodes) : onSelectAll(allCodes)
            }
            className={cn(
              'text-xs font-medium hover:underline',
              allSelected ? 'text-muted-foreground' : 'text-accent-foreground',
            )}
          >
            {allSelected ? 'Deselect all' : someSelected ? 'Select all' : 'Select all'}
          </button>
        )}
      </div>

      <div className="divide-y divide-border">
        {permissions.map((p) => {
          const checked = selectedCodes.has(p.code);
          return (
            <label
              key={p.code}
              className={cn(
                'flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-secondary/50',
                checked && 'bg-accent-light/40',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => !disabled && onToggle(p.code)}
                disabled={disabled}
                className={cn(
                  'mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-2 focus:ring-ring cursor-pointer',
                  disabled && 'cursor-not-allowed',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground font-mono">{p.code}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}