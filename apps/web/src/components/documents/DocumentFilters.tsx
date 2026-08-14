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
import type { DocumentStatus } from '@/lib/api/documents';

export interface DocumentFilterValues {
  search: string;
  status: DocumentStatus | '';
  documentType: string;
}

interface DocumentFiltersProps {
  filters: DocumentFilterValues;
  onChange: (filters: DocumentFilterValues) => void;
}

const STATUSES: { value: DocumentStatus; label: string }[] = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'RESUBMISSION_REQUIRED', label: 'Resubmission Required' },
];

const DEFAULT: DocumentFilterValues = { search: '', status: '', documentType: '' };

export function DocumentFilters({ filters, onChange }: DocumentFiltersProps) {
  const hasActive = filters.search !== '' || filters.status !== '' || filters.documentType !== '';

  const update = useCallback(
    function <K extends keyof DocumentFilterValues>(
      key: K,
      value: DocumentFilterValues[K],
    ): void {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search doc # or name…"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={(v) => {
          const value = v ?? '';
          update('status', value === 'all' ? '' : (value as DocumentStatus));
        }}
      >
        <SelectTrigger className="h-9 w-[180px] text-sm">
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

      <Input
        placeholder="Document type (e.g., PASSPORT)"
        value={filters.documentType}
        onChange={(e) => update('documentType', e.target.value.toUpperCase())}
        className="h-9 w-[200px] text-sm"
      />

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