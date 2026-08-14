'use client';

import { useCallback } from 'react';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { ApplicationStatus } from '@/lib/api/applications';
import { APPLICATION_STATUS_LABELS } from './ApplicationStatusBadge';
import { usePrograms } from '@/hooks/usePrograms';
import { useVisaCategories } from '@/hooks/useVisaCategories';

export interface ApplicationFilterValues {
  status: ApplicationStatus | '';
  programId: string;
  visaCategoryId: string;
  intakeYear: string;
}

interface ApplicationFiltersProps {
  filters: ApplicationFilterValues;
  onChange: (filters: ApplicationFilterValues) => void;
}

const DEFAULT: ApplicationFilterValues = {
  status: '',
  programId: '',
  visaCategoryId: '',
  intakeYear: '',
};

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

export function ApplicationFilters({ filters, onChange }: ApplicationFiltersProps) {
  const { data: programs = [] } = usePrograms();
  const { data: visaCategories = [] } = useVisaCategories();

  const hasActive =
    filters.status !== '' ||
    filters.programId !== '' ||
    filters.visaCategoryId !== '' ||
    filters.intakeYear !== '';

  const update = useCallback(
    function <K extends keyof ApplicationFilterValues>(
      key: K,
      value: ApplicationFilterValues[K],
    ): void {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <Select
        value={filters.status || 'all'}
        onValueChange={(v) => {
          const value = v ?? '';
          update('status', value === 'all' ? '' : (value as ApplicationStatus));
        }}
      >
        <SelectTrigger className="h-9 w-[200px] text-sm">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.programId || 'all'}
        onValueChange={(v) => {
          const value = v ?? '';
          update('programId', value === 'all' ? '' : value);
        }}
      >
        <SelectTrigger className="h-9 w-[180px] text-sm">
          <SelectValue placeholder="All Programs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Programs</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.visaCategoryId || 'all'}
        onValueChange={(v) => {
          const value = v ?? '';
          update('visaCategoryId', value === 'all' ? '' : value);
        }}
      >
        <SelectTrigger className="h-9 w-[170px] text-sm">
          <SelectValue placeholder="All Visa Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Visa Types</SelectItem>
          {visaCategories.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.intakeYear || 'all'}
        onValueChange={(v) => {
          const value = v ?? '';
          update('intakeYear', value === 'all' ? '' : value);
        }}
      >
        <SelectTrigger className="h-9 w-[130px] text-sm">
          <SelectValue placeholder="Any Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Year</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
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