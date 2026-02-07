import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { MapPin, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useT } from "@/lib/i18n";
import { TRANSPORT_CITIES, TRANSPORT_ROUTES, getRouteById } from "@/constants/transport-routes";

const cities = [
  "Porto", "Lisboa", "Saint-Jean-Pied-de-Port", "Pamplona", "Estella",
  "Logroño", "Burgos", "León", "Astorga", "Ponferrada",
  "Sarria", "Santiago de Compostela", "Fisterra", "Barcelos", "Tui",
  "Finisterra", "Madrid",
];

const cityCoords: Record<string, { lat: number; lng: number }> = {
  "Porto": { lat: 41.1579, lng: -8.6291 },
  "Lisboa": { lat: 38.7223, lng: -9.1393 },
  "Saint-Jean-Pied-de-Port": { lat: 43.1633, lng: -1.2376 },
  "Pamplona": { lat: 42.8125, lng: -1.6458 },
  "Estella": { lat: 42.6714, lng: -2.0313 },
  "Logroño": { lat: 42.4627, lng: -2.4446 },
  "Burgos": { lat: 42.3440, lng: -3.6969 },
  "León": { lat: 42.5987, lng: -5.5671 },
  "Astorga": { lat: 42.4556, lng: -6.0567 },
  "Ponferrada": { lat: 42.5499, lng: -6.5985 },
  "Sarria": { lat: 42.7799, lng: -7.4148 },
  "Santiago de Compostela": { lat: 42.8782, lng: -8.5448 },
  "Fisterra": { lat: 42.9065, lng: -9.2655 },
  "Barcelos": { lat: 41.5312, lng: -8.6151 },
  "Tui": { lat: 42.0473, lng: -8.6438 },
  "Finisterra": { lat: 42.9065, lng: -9.2655 },
  "Madrid": { lat: 40.4168, lng: -3.7038 },
};

const formSchema = z.object({
  title: z.string().default(""),
  description: z.string().optional(),
  type: z.enum(["transport", "meal", "hike", "lodging"]),
  city: z.string().default(""),
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().optional(),
  spots: z.coerce.number().min(2).max(20).default(4),
  transportFrom: z.string().optional(),
  transportTo: z.string().optional(),
  transportRouteId: z.string().optional(),
}).refine((data) => {
  if (data.type === "transport") {
    return !!data.transportFrom;
  }
  return true;
}, {
  message: "Selecione a cidade de saída",
  path: ["transportFrom"],
}).refine((data) => {
  if (data.type === "transport") {
    return !!data.transportTo;
  }
  return true;
}, {
  message: "Selecione a cidade de chegada",
  path: ["transportTo"],
}).refine((data) => {
  if (data.type === "transport" && data.transportFrom && data.transportTo) {
    return data.transportFrom !== data.transportTo;
  }
  return true;
}, {
  message: "Saída e chegada precisam ser diferentes",
  path: ["transportTo"],
}).refine((data) => {
  if (data.type !== "transport") {
    return data.title.length >= 3;
  }
  return true;
}, {
  message: "Mínimo 3 caracteres",
  path: ["title"],
}).refine((data) => {
  if (data.type === "transport") return true;
  return data.city.length >= 1;
}, {
  message: "Selecione uma cidade",
  path: ["city"],
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateActivity() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useT();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "transport",
      city: "",
      date: "",
      time: "",
      spots: 4,
      transportFrom: "",
      transportTo: "",
      transportRouteId: "",
    },
  });

  const activityType = form.watch("type");
  const transportFrom = form.watch("transportFrom");
  const transportTo = form.watch("transportTo");

  const handleRouteSelect = (routeId: string) => {
    form.setValue("transportRouteId", routeId);
    const route = getRouteById(routeId);
    if (route) {
      form.setValue("transportFrom", route.from);
      form.setValue("transportTo", route.to);
      const coords = cityCoords[route.from];
      if (coords) {
        form.setValue("city", route.from);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const city = data.type === "transport" && data.transportFrom ? data.transportFrom : data.city;
      const coords = cityCoords[city] || { lat: 42.88, lng: -8.54 };

      let title = data.title;
      if (data.type === "transport" && data.transportFrom && data.transportTo && !data.title.trim()) {
        title = `${t("type_transport")}: ${data.transportFrom} → ${data.transportTo}`;
      }

      const payload: any = {
        title,
        description: data.description,
        type: data.type,
        city,
        date: data.date,
        time: data.time,
        spots: data.spots,
        lat: coords.lat,
        lng: coords.lng,
      };

      if (data.type === "transport") {
        payload.transportFrom = data.transportFrom || null;
        payload.transportTo = data.transportTo || null;
        payload.transportRouteId = data.transportRouteId || null;
      }

      const res = await apiRequest("POST", "/api/activities", payload);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: t("create_success"), description: t("create_success_desc") });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recommended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/mine"] });
      setLocation(`/activity/${data.id}`);
    },
    onError: () => {
      toast({ title: t("create_error"), description: t("create_error_desc"), variant: "destructive" });
    },
  });

  const transportCityNames = TRANSPORT_CITIES.map((c) => c.name);

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-serif text-xl font-bold" data-testid="text-create-title">{t("create_title")}</h1>
      </div>

      <Card className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create_field_type")}</FormLabel>
                  <Select onValueChange={(val) => { field.onChange(val); if (val !== "transport") { form.setValue("transportFrom", ""); form.setValue("transportTo", ""); form.setValue("transportRouteId", ""); } }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="transport">{t("type_transport")}</SelectItem>
                      <SelectItem value="meal">{t("type_meal")}</SelectItem>
                      <SelectItem value="hike">{t("type_hike")}</SelectItem>
                      <SelectItem value="lodging">{t("type_lodging")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {activityType === "transport" && (
              <>
                <FormField
                  control={form.control}
                  name="transportRouteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("transport_suggested_route")}</FormLabel>
                      <Select onValueChange={handleRouteSelect} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-route">
                            <SelectValue placeholder={t("transport_route_placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRANSPORT_ROUTES.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="transportFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("transport_from")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-transport-from">
                              <SelectValue placeholder={t("transport_from_placeholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {transportCityNames.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transportTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("transport_to")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-transport-to">
                              <SelectValue placeholder={t("transport_to_placeholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {transportCityNames.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create_field_title")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={activityType === "transport" && transportFrom && transportTo
                        ? `${t("type_transport")}: ${transportFrom} → ${transportTo}`
                        : t("create_field_title_placeholder")}
                      {...field}
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create_field_description")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("create_field_description_placeholder")} {...field} data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              {activityType !== "transport" && (
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("create_field_city")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-city">
                            <SelectValue placeholder={t("create_field_city_placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="spots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create_field_spots")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={2} max={20} {...field} data-testid="input-spots" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create_field_date")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create_field_time")}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
              data-testid="button-submit-activity"
            >
              {createMutation.isPending ? t("create_submitting") : t("create_submit")}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
