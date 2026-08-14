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
import type { LeadStatus, LeadSource } from '@/lib/api/leads';

export interface LeadFilterValues {
  search: string;
  status: LeadStatus | '';
  source: LeadSource | '';
}

interface LeadFiltersProps {
  filters: LeadFilterValues;
  onChange: (filters: LeadFilterValues) => void;
}

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'COUNSELING_BOOKED', label: 'Counseling Booked' },
  { value: 'COUNSELING_ATTENDED', label: 'Counseling Attended' },
  { value: 'NO_SHOW', label: 'No Show' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'LOST', label: 'Lost' },
];

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'GOOGLE_FORM', label: 'Google Form' },
  { value: 'OTHER', label: 'Other' },
];

const DEFAULT_FILTERS: LeadFilterValues = {
  search: '',
  status: '',
  source: '',
};

export function LeadFilters({ filters, onChange }: LeadFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' || filters.status !== '' || filters.source !== '';

  const update = useCallback(
    <K extends keyof LeadFilterValues>(key: K, value: LeadFilterValues[K]) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  const reset = useCallback(() => {
    onChange(DEFAULT_FILTERS);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name, phone, email…"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={(v) =>
          update('status', v === 'all' ? '' : (v as LeadStatus))
        }
      >
        <SelectTrigger className="h-9 w-[190px] text-sm">
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

      <Select
        value={filters.source || 'all'}
        onValueChange={(v) =>
          update('source', v === 'all' ? '' : (v as LeadSource))
        }
      >
        <SelectTrigger className="h-9 w-[170px] text-sm">
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {SOURCES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}