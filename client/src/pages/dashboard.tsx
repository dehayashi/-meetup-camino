import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ActivityCard } from "@/components/activity-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Calendar, Plus, TrendingUp, Heart, Trophy } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useT } from "@/lib/i18n";
import type { Activity, PilgrimProfile } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useT();

  const { data: profile, isLoading: profileLoading } = useQuery<PilgrimProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: recommended, isLoading: activitiesLoading } = useQuery<(Activity & { participantCount?: number; creatorName?: string })[]>({
    queryKey: ["/api/activities/recommended"],
  });

  const { data: myActivities } = useQuery<(Activity & { participantCount?: number; creatorName?: string })[]>({
    queryKey: ["/api/activities/mine"],
  });

  if (profileLoading) {
    return (
      <div className="p-4 space-y-4 pb-20">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 pb-20">
        <Card className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-xl font-bold mb-2" data-testid="text-welcome">{t("dashboard_welcome")}</h2>
          <p className="text-muted-foreground text-sm mb-4">
            {t("dashboard_setup_desc")}
          </p>
          <Link href="/profile">
            <Button data-testid="button-setup-profile">{t("dashboard_setup_btn")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={profile.photoUrl || user?.profileImageUrl || ""} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {profile.displayName?.charAt(0).toUpperCase() || "P"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg truncate" data-testid="text-greeting">
            {t("dashboard_greeting", { name: profile.displayName || "" })}
          </h1>
          <p className="text-sm text-muted-foreground">{t("buen_camino")}</p>
        </div>
      </div>

      {profile.cities && profile.cities.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          {profile.cities.slice(0, 3).map((city) => (
            <span key={city} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
              {city}
            </span>
          ))}
          {profile.cities.length > 3 && (
            <span className="text-xs text-muted-foreground">+{profile.cities.length - 3}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Link href="/create">
          <Card className="p-4 hover-elevate overflow-visible cursor-pointer">
            <Plus className="w-5 h-5 text-primary mb-2" />
            <span className="text-sm font-medium">{t("dashboard_create_activity")}</span>
          </Card>
        </Link>
        <Link href="/ranking">
          <Card className="p-4 hover-elevate overflow-visible cursor-pointer" data-testid="link-ranking">
            <Trophy className="w-5 h-5 text-yellow-500 mb-2" />
            <span className="text-sm font-medium">{t("dashboard_ranking")}</span>
          </Card>
        </Link>
        <Link href="/donate">
          <Card className="p-4 hover-elevate overflow-visible cursor-pointer">
            <Heart className="w-5 h-5 text-destructive mb-2" />
            <span className="text-sm font-medium">{t("dashboard_support")}</span>
          </Card>
        </Link>
      </div>

      {myActivities && myActivities.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              {t("dashboard_my_activities")}
            </h2>
            <Link href="/activities">
              <Button variant="ghost" size="sm" data-testid="button-see-all-mine">{t("dashboard_see_all")}</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {myActivities.slice(0, 3).map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                onClick={() => setLocation(`/activity/${act.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t("dashboard_recommended")}
          </h2>
          <Link href="/activities">
            <Button variant="ghost" size="sm" data-testid="button-see-all-recommended">{t("dashboard_see_all")}</Button>
          </Link>
        </div>
        {activitiesLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ) : recommended && recommended.length > 0 ? (
          <div className="space-y-3">
            {recommended.slice(0, 5).map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                onClick={() => setLocation(`/activity/${act.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              {t("dashboard_no_recommended")}
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
