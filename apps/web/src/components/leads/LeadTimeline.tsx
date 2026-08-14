'use client';

import { formatDistance } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Lead } from '@/lib/api/leads';
import { Activity } from 'lucide-react';

interface LeadTimelineProps {
  lead: Lead;
}

export function LeadTimeline({ lead }: LeadTimelineProps) {
  // Simple timeline based on lead's key events
  const events = [
    {
      label: 'Lead created',
      date: lead.createdAt,
      description: `via ${lead.source}`,
    },
    ...(lead.assignedCounselor
      ? [
          {
            label: 'Counselor assigned',
            date: lead.updatedAt,
            description: `${lead.assignedCounselor.firstName} ${lead.assignedCounselor.lastName}`,
          },
        ]
      : []),
    ...(lead.convertedAt
      ? [
          {
            label: 'Converted to student',
            date: lead.convertedAt,
            description: lead.convertedToStudent?.studentId ?? '',
          },
        ]
      : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />
          <ul className="space-y-4">
            {events.map((event, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
                <div className="text-sm font-medium text-foreground">
                  {event.label}
                </div>
                {event.description && (
                  <div className="text-xs text-muted-foreground">
                    {event.description}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDistance(new Date(event.date), new Date(), {
                    addSuffix: true,
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}