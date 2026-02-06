import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users, Car, UtensilsCrossed, Mountain, BedDouble } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { Activity } from "@shared/schema";

const typeColors: Record<string, string> = {
  transport: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  meal: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  hike: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  lodging: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const typeIcons: Record<string, typeof Car> = {
  transport: Car,
  meal: UtensilsCrossed,
  hike: Mountain,
  lodging: BedDouble,
};

interface ActivityCardProps {
  activity: Activity & { participantCount?: number; creatorName?: string };
  onClick?: () => void;
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const { t } = useT();
  const typeLabels: Record<string, string> = {
    transport: t("type_transport"),
    meal: t("type_meal"),
    hike: t("type_hike"),
    lodging: t("type_lodging"),
  };

  const TypeIcon = typeIcons[activity.type] || typeIcons.hike;
  const color = typeColors[activity.type] || typeColors.hike;
  const label = typeLabels[activity.type] || typeLabels.hike;
  const spotsLeft = (activity.spots || 4) - (activity.participantCount || 0);

  const spotsText = spotsLeft > 0
    ? (spotsLeft === 1 ? t("spots_one", { count: spotsLeft }) : t("spots_other", { count: spotsLeft }))
    : t("spots_full");

  return (
    <Card
      className="hover-elevate cursor-pointer overflow-visible p-4"
      onClick={onClick}
      data-testid={`activity-card-${activity.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-md p-2.5 ${color}`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-sm leading-tight truncate" data-testid={`activity-title-${activity.id}`}>
              {activity.title}
            </h3>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {label}
            </Badge>
          </div>
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {activity.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {activity.city}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {activity.date}
            </span>
            {activity.time && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {activity.time}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className={spotsLeft <= 1 ? "text-destructive font-medium" : "text-muted-foreground"}>
                {spotsText}
              </span>
            </span>
            {activity.creatorName && (
              <span className="text-[10px] text-muted-foreground">
                {t("by_creator", { name: activity.creatorName })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
