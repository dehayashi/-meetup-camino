import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Activity, Medal } from "lucide-react";
import { useT } from "@/lib/i18n";

interface RankedUser {
  userId: string;
  displayName: string;
  photoUrl: string | null;
  avgRating: number;
  totalRatings: number;
  activitiesCreated: number;
}

function RankBadge({ position }: { position: number }) {
  if (position === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
  if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (position === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{position}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-xs font-medium ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function Ranking() {
  const { t } = useT();

  const { data: rankings, isLoading } = useQuery<RankedUser[]>({
    queryKey: ["/api/rankings"],
  });

  return (
    <div className="p-4 pb-20 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h1 className="font-serif text-xl font-bold" data-testid="text-ranking-title">{t("ranking_title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground" data-testid="text-ranking-desc">{t("ranking_description")}</p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : rankings && rankings.length > 0 ? (
        <div className="space-y-2">
          {rankings.map((user, index) => (
            <Card
              key={user.userId}
              className={`p-3 ${index < 3 ? "border-primary/20" : ""}`}
              data-testid={`ranking-card-${index}`}
            >
              <div className="flex items-center gap-3">
                <RankBadge position={index + 1} />
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.photoUrl || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" data-testid={`ranking-name-${index}`}>
                    {user.displayName}
                  </p>
                  <StarRating rating={user.avgRating} />
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">
                    {t("ranking_ratings_count", { count: user.totalRatings })}
                  </Badge>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Activity className="w-3 h-3" />
                    {t("ranking_activities_count", { count: user.activitiesCreated })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Trophy className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm" data-testid="text-ranking-empty">
            {t("ranking_empty")}
          </p>
        </Card>
      )}
    </div>
  );
}
