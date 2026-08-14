'use client';

import { MapPin, Sparkles } from 'lucide-react';
import { useMyJourney } from '@/hooks/useJourney';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';

export default function MyJourneyPage() {
  const { data: journey, isLoading } = useMyJourney();

  if (isLoading) {
    return <LoadingState fullPage message="Loading your journey…" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          My Account
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          My Journey
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your progress from registration to Japan
        </p>
      </div>

      {!journey ? (
        <Card>
          <EmptyState
            icon={MapPin}
            title="Your journey hasn't started yet"
            description="Once your counselor sets up your journey, you'll see your progress milestones here."
          />
        </Card>
      ) : (
        <>
          {/* Hero Progress */}
          <Card
            className={
              journey.overallProgress === 100
                ? 'border-success/30 bg-success/5'
                : 'border-accent/30 bg-accent-light/30'
            }
          >
            <CardContent className="p-6 text-center">
              {journey.overallProgress === 100 ? (
                <>
                  <div className="flex justify-center mb-3">
                    <Sparkles className="h-8 w-8 text-success" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Congratulations!</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have completed all milestones. 🎉
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Your Progress
                  </p>
                  <p className="mt-2 text-5xl font-bold tabular-nums text-foreground">
                    {journey.overallProgress}%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {journey.completedCount} of {journey.totalRequired} required
                    milestones complete
                  </p>
                  {journey.currentMilestone && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Currently
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {journey.currentMilestone.title}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Visa Pathway
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {journey.visaCategory.name}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline (read-only for students) */}
          <JourneyTimeline journey={journey} editable={false} />
        </>
      )}
    </div>
  );
}