import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActivityCard } from "@/components/activity-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Search, Filter, Car, UtensilsCrossed, Mountain, BedDouble, CalendarRange, X as XIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useT } from "@/lib/i18n";
import type { Activity } from "@shared/schema";

export default function Activities() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { t } = useT();

  const typeFilters = useMemo(() => [
    { value: "", label: t("filter_all"), icon: Filter },
    { value: "transport", label: t("type_transport"), icon: Car },
    { value: "meal", label: t("type_meal"), icon: UtensilsCrossed },
    { value: "hike", label: t("type_hike"), icon: Mountain },
    { value: "lodging", label: t("type_lodging"), icon: BedDouble },
  ], [t]);

  const { data: activities, isLoading } = useQuery<(Activity & { participantCount?: number; creatorName?: string })[]>({
    queryKey: ["/api/activities"],
  });

  const filtered = activities?.filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || a.type === typeFilter;
    const matchDate = (!dateFrom || a.date >= dateFrom) && (!dateTo || a.date <= dateTo);
    return matchSearch && matchType && matchDate;
  });

  return (
    <div className="p-4 pb-20 space-y-4 max-w-lg mx-auto">
      <h1 className="font-serif text-xl font-bold" data-testid="text-activities-title">{t("activities_title")}</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("activities_search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-activities"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {typeFilters.map((f) => {
          const Icon = f.icon;
          const isActive = typeFilter === f.value;
          return (
            <Button
              key={f.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(f.value)}
              className="shrink-0"
              data-testid={`filter-${f.value || "all"}`}
            >
              <Icon className="w-3.5 h-3.5 mr-1" />
              {f.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <CalendarRange className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="flex-1 min-w-[130px]"
          placeholder={t("filter_date_from")}
          data-testid="input-date-from"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="flex-1 min-w-[130px]"
          placeholder={t("filter_date_to")}
          data-testid="input-date-to"
        />
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            data-testid="button-clear-dates"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-md" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              onClick={() => setLocation(`/activity/${act.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t("activities_no_results")}
          </p>
        </Card>
      )}
    </div>
  );
}
