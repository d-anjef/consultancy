'use client';

import { useState } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useStudents } from '@/hooks/useStudents';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import type { Student } from '@/lib/api/students';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (student: Student) => void;
  title?: string;
  description?: string;
}

export function StudentPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = 'Select Student',
  description = 'Choose a student to continue',
}: Props) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useStudents({
    search: search || undefined,
    limit: 50,
  });

  const students = data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by name or student ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {isLoading ? (
            <LoadingState message="Searching…" />
          ) : students.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search ? 'No students match your search.' : 'No students found.'}
            </div>
          ) : (
            students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelect(s);
                  onOpenChange(false);
                }}
                className="w-full text-left flex items-center gap-3 p-3 rounded-md border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">
                    {s.personal.firstName} {s.personal.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {s.studentId} · {s.branch.name}
                  </div>
                </div>
                {s.status && (
                  <span className="text-xs text-muted-foreground uppercase">
                    {s.status}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}