import { useQuery } from "@tanstack/react-query";
import { MapView } from "@/components/map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import type { Activity } from "@shared/schema";

export default function MapPage() {
  const [, setLocation] = useLocation();

  const { data: activities, isLoading } = useQuery<(Activity & { participantCount?: number })[]>({
    queryKey: ["/api/activities"],
  });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-56px)] p-4">
        <Skeleton className="w-full h-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)]" data-testid="map-page">
      <MapView
        activities={activities || []}
        onActivityClick={(id) => setLocation(`/activity/${id}`)}
      />
    </div>
  );
}
