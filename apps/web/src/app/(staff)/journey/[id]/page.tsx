'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useMilestoneTemplate, useUpdateTemplate } from '@/hooks/useJourney';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { Label } from '@/components/ui/label';
import type { MilestoneItem } from '@/lib/api/journey';

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: template, isLoading } = useMilestoneTemplate(id);
  const updateTemplate = useUpdateTemplate(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? '');
      setIsActive(template.isActive);
      setMilestones(template.milestones);
    }
  }, [template]);

  function updateMilestone<K extends keyof MilestoneItem>(
    idx: number,
    key: K,
    value: MilestoneItem[K],
  ) {
    setMilestones((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [key]: value } : m)),
    );
  }

  function addMilestone() {
    setMilestones((prev) => [
      ...prev,
      {
        key: '',
        title: '',
        order: prev.length,
        isRequired: true,
      },
    ]);
  }

  function removeMilestone(idx: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= milestones.length) return;
    const arr = [...milestones];
    [arr[idx], arr[target]] = [arr[target]!, arr[idx]!];
    setMilestones(arr);
  }

  async function handleSave() {
    // Validate keys
    const keys = new Set<string>();
    for (const m of milestones) {
      if (!m.key || !/^[a-z0-9_]+$/.test(m.key)) {
        toast.error(`Invalid key: "${m.key}" — use lowercase, numbers, underscores`);
        return;
      }
      if (!m.title.trim()) {
        toast.error('All milestones need a title');
        return;
      }
      if (keys.has(m.key)) {
        toast.error(`Duplicate key: "${m.key}"`);
        return;
      }
      keys.add(m.key);
    }

    try {
      await updateTemplate.mutateAsync({
        name,
        description: description || undefined,
        isActive,
        milestones: milestones.map((m, i) => ({
          ...m,
          order: i,
        })),
      });
      toast.success('Template updated');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update');
    }
  }

  if (isLoading) return <LoadingState message="Loading template…" />;
  if (!template) return <div>Template not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/journey')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{template.name}</h1>
            <Badge variant="outline" className="font-mono">
              {template.visaCategory.code}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit template details and milestones
          </p>
        </div>
        <Button variant="accent" onClick={handleSave} isLoading={updateTemplate.isPending}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(!!v)}
                />
                <Label htmlFor="isActive" className="cursor-pointer !mt-0">
                  Template is active
                </Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Milestones ({milestones.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={addMilestone}>
            <Plus className="h-3.5 w-3.5" />
            Add Milestone
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Milestone
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => move(idx, 'up')}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => move(idx, 'down')}
                    disabled={idx === milestones.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  {milestones.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeMilestone(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Key *</Label>
                  <Input
                    value={m.key}
                    onChange={(e) => updateMilestone(idx, 'key', e.target.value)}
                    className="font-mono text-xs"
                    placeholder="registration"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Title *</Label>
                  <Input
                    value={m.title}
                    onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                    placeholder="Registration"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={m.description ?? ''}
                  onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                  placeholder="Optional…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Estimated Days</Label>
                  <Input
                    type="number"
                    value={m.estimatedDays ?? ''}
                    onChange={(e) =>
                      updateMilestone(
                        idx,
                        'estimatedDays',
                        e.target.value ? parseInt(e.target.value, 10) : undefined,
                      )
                    }
                    placeholder="30"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`req-${idx}`}
                      checked={m.isRequired}
                      onCheckedChange={(v) => updateMilestone(idx, 'isRequired', !!v)}
                    />
                    <Label htmlFor={`req-${idx}`} className="cursor-pointer text-xs !mt-0">
                      Required milestone
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}