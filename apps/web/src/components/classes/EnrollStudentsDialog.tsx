'use client';

import { useState, useMemo } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useStudents } from '@/hooks/useStudents';
import { useEnrollStudents } from '@/hooks/useClasses';
import type { ClassEntity } from '@/lib/api/classes';

interface EnrollStudentsDialogProps {
  cls: ClassEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnrollStudentsDialog({
  cls,
  open,
  onOpenChange,
}: EnrollStudentsDialogProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data } = useStudents({ search: search || undefined, status: 'ACTIVE', limit: 50 });
  const enroll = useEnrollStudents(cls.id);

  // Already enrolled IDs — exclude from list
  const enrolledIds = useMemo(
    () => new Set(cls.students.map((s) => s.id)),
    [cls.students],
  );

  const available = (data?.items ?? []).filter((s) => !enrolledIds.has(s.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    setSelected(new Set());
    setSearch('');
    onOpenChange(false);
  }

  async function handleEnroll() {
    if (selected.size === 0) return;
    await enroll.mutateAsync(Array.from(selected));
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-accent" />
            Enroll Students
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            Class: <span className="font-medium text-foreground">{cls.name}</span>
            {' · '}
            <span className="font-mono">{cls.classCode}</span>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search active students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="accent">{selected.size} selected</Badge>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}

        {/* Student list */}
        <div className="max-h-[320px] overflow-y-auto space-y-1 rounded-md border border-border p-1">
          {available.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search ? 'No students match your search.' : 'All active students are already enrolled.'}
            </div>
          ) : (
            available.map((s) => {
              const isChecked = selected.has(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className="flex items-center gap-3 rounded-md p-2.5 cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggle(s.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {s.personal.firstName} {s.personal.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {s.studentId}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xxs shrink-0">
                    {s.branch.code}
                  </Badge>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleEnroll}
            disabled={selected.size === 0}
            isLoading={enroll.isPending}
            loadingText="Enrolling…"
          >
            Enroll {selected.size > 0 ? `${selected.size} Student${selected.size > 1 ? 's' : ''}` : 'Students'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}