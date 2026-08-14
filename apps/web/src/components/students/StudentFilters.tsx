'use client';

import { useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { StudentStatus } from '@/lib/api/students';

export interface StudentFilterValues {
  search: string;
  status: StudentStatus | '';
}

interface StudentFiltersProps {
  filters: StudentFilterValues;
  onChange: (filters: StudentFilterValues) => void;
}

const STATUSES: { value: StudentStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const DEFAULT: StudentFilterValues = { search: '', status: '' };

export function StudentFilters({ filters, onChange }: StudentFiltersProps) {
  const hasActive = filters.search !== '' || filters.status !== '';

  const update = useCallback(
    <K extends keyof StudentFilterValues>(key: K, value: StudentFilterValues[K]) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name, student ID, phone…"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={(v) => update('status', v === 'all' ? '' : (v as StudentStatus))}
      >
        <SelectTrigger className="h-9 w-[170px] text-sm">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT)}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}