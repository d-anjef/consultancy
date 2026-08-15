'use client';

import { MapPin } from 'lucide-react';
import { useMyJourney } from '@/hooks/useJourney';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';

export default function MyJourneyPage() {
  const { data: journey, isLoading } = useMyJourney();

  if (isLoading) return <LoadingState message="Loading your journey…" />;

  if (!journey) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Journey
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your progress towards your goal
          </p>
        </div>
        <Card>
          <EmptyState
            icon={MapPin}
            title="Journey not started yet"
            description="Your journey will appear once your counselor sets it up."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Journey
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {journey.visaCategory.name}
        </p>
      </div>

      <JourneyTimeline journey={journey} editable={false} />
    </div>
  );
}