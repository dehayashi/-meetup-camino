import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, Save, X, Plus, Bell, BellOff, Loader2, Camera, Languages } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import type { PilgrimProfile } from "@shared/schema";
import { countries, getFlagUrl, getCountryName } from "@/constants/countries";

const cities = [
  "Porto", "Lisboa", "Saint-Jean-Pied-de-Port", "Pamplona", "Estella",
  "Logro\u00f1o", "Burgos", "Le\u00f3n", "Astorga", "Ponferrada",
  "Sarria", "Santiago de Compostela", "Fisterra",
];

const languages = [
  { value: "pt", label: "Portugu\u00eas" },
  { value: "en", label: "English" },
  { value: "es", label: "Espa\u00f1ol" },
  { value: "fr", label: "Fran\u00e7ais" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "ko", label: "\ud55c\uad6d\uc5b4" },
  { value: "ja", label: "\u65e5\u672c\u8a9e" },
];

const spokenLanguageOptions = [
  { value: "pt", label: "Portugu\u00eas" },
  { value: "en", label: "English" },
  { value: "es", label: "Espa\u00f1ol" },
  { value: "fr", label: "Fran\u00e7ais" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "nl", label: "Nederlands" },
  { value: "ko", label: "\ud55c\uad6d\uc5b4" },
  { value: "ja", label: "\u65e5\u672c\u8a9e" },
  { value: "zh", label: "\u4e2d\u6587" },
  { value: "ru", label: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  { value: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { value: "hi", label: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { value: "pl", label: "Polski" },
];

const profileSchema = z.object({
  displayName: z.string().min(2, "M\u00ednimo 2 caracteres"),
  language: z.string().default("pt"),
  nationality: z.string().optional(),
  bio: z.string().optional(),
  travelStartDate: z.string().optional(),
  travelEndDate: z.string().optional(),
  prefTransport: z.coerce.number().min(0).max(5).default(3),
  prefMeals: z.coerce.number().min(0).max(5).default(3),
  prefHiking: z.coerce.number().min(0).max(5).default(3),
  prefLodging: z.coerce.number().min(0).max(5).default(3),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useT();
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedSpokenLanguages, setSelectedSpokenLanguages] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  const { data: profile, isLoading } = useQuery<PilgrimProfile | null>({
    queryKey: ["/api/profile"],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      language: "pt",
      nationality: "",
      bio: "",
      travelStartDate: "",
      travelEndDate: "",
      prefTransport: 3,
      prefMeals: 3,
      prefHiking: 3,
      prefLodging: 3,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || "",
        language: profile.language || "pt",
        nationality: profile.nationality || "",
        bio: profile.bio || "",
        travelStartDate: profile.travelStartDate || "",
        travelEndDate: profile.travelEndDate || "",
        prefTransport: profile.prefTransport || 3,
        prefMeals: profile.prefMeals || 3,
        prefHiking: profile.prefHiking || 3,
        prefLodging: profile.prefLodging || 3,
      });
      setSelectedCities(profile.cities || []);
      setSelectedSpokenLanguages(profile.spokenLanguages || []);
    } else if (user) {
      form.setValue("displayName", [user.firstName, user.lastName].filter(Boolean).join(" ") || "");
    }
  }, [profile, user]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("profile_photo_too_large"), variant: "destructive" });
      return;
    }
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const photoData = reader.result as string;
          await apiRequest("POST", "/api/profile/photo", { photoData });
          queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
          toast({ title: t("profile_photo_saved") });
        } catch {
          toast({ title: t("profile_photo_error"), variant: "destructive" });
        }
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: t("profile_photo_error"), variant: "destructive" });
      setPhotoUploading(false);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("POST", "/api/profile", {
        ...data,
        cities: selectedCities,
        spokenLanguages: selectedSpokenLanguages,
        photoUrl: profile?.photoUrl || user?.profileImageUrl || "",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("profile_saved") });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: () => {
      toast({ title: t("profile_save_error"), variant: "destructive" });
    },
  });

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 pb-20 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-60 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-serif text-xl font-bold" data-testid="text-profile-title">{t("profile_title")}</h1>
        <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-1" />
          {t("profile_logout")}
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <Avatar className="w-14 h-14">
            <AvatarImage src={profile?.photoUrl || user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {user?.firstName?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="photo-upload"
            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer"
            data-testid="button-upload-photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            data-testid="input-photo-upload"
          />
        </div>
        <div>
          <p className="font-semibold flex items-center gap-1.5">
            {profile?.nationality && (
              <img
                src={getFlagUrl(profile.nationality, 20)}
                alt={getCountryName(profile.nationality)}
                className="w-5 h-3.5 rounded-sm inline-block"
                data-testid="flag-profile"
              />
            )}
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {profile?.spokenLanguages && profile.spokenLanguages.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-spoken-languages">
              {profile.spokenLanguages.map(l => spokenLanguageOptions.find(o => o.value === l)?.label || l).join(", ")}
            </p>
          )}
          {photoUploading && <p className="text-xs text-muted-foreground">{t("profile_uploading_photo")}</p>}
        </div>
      </div>

      <Card className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profile_display_name")}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-display-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile_language")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languages.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile_nationality")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-nationality">
                          <SelectValue placeholder={t("profile_nationality_placeholder")}>
                            {field.value && (
                              <span className="flex items-center gap-1.5">
                                <img src={getFlagUrl(field.value, 20)} alt="" className="w-5 h-3.5 rounded-sm inline-block" />
                                {getCountryName(field.value)}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="flex items-center gap-1.5">
                              <img src={getFlagUrl(c.code, 20)} alt="" className="w-5 h-3.5 rounded-sm inline-block" />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profile_bio")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("profile_bio_placeholder")} {...field} data-testid="input-bio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="travelStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile_travel_start")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-travel-start" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="travelEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile_travel_end")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-travel-end" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>{t("profile_cities")}</FormLabel>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {cities.map((city) => {
                  const isSelected = selectedCities.includes(city);
                  return (
                    <Badge
                      key={city}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer toggle-elevate"
                      onClick={() => toggleCity(city)}
                      data-testid={`city-badge-${city}`}
                    >
                      {isSelected ? (
                        <X className="w-3 h-3 mr-0.5" />
                      ) : (
                        <Plus className="w-3 h-3 mr-0.5" />
                      )}
                      {city}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <FormLabel className="flex items-center gap-1.5">
                <Languages className="w-4 h-4" />
                {t("profile_spoken_languages")}
              </FormLabel>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">{t("profile_spoken_languages_desc")}</p>
              <div className="flex flex-wrap gap-1.5">
                {spokenLanguageOptions.map((lang) => {
                  const isSelected = selectedSpokenLanguages.includes(lang.value);
                  return (
                    <Badge
                      key={lang.value}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer toggle-elevate"
                      onClick={() =>
                        setSelectedSpokenLanguages((prev) =>
                          prev.includes(lang.value)
                            ? prev.filter((l) => l !== lang.value)
                            : [...prev, lang.value]
                        )
                      }
                      data-testid={`spoken-lang-badge-${lang.value}`}
                    >
                      {isSelected ? (
                        <X className="w-3 h-3 mr-0.5" />
                      ) : (
                        <Plus className="w-3 h-3 mr-0.5" />
                      )}
                      {lang.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <FormLabel>{t("profile_preferences")}</FormLabel>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <FormField
                  control={form.control}
                  name="prefTransport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("profile_pref_transport")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={5} {...field} data-testid="input-pref-transport" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prefMeals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("profile_pref_meals")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={5} {...field} data-testid="input-pref-meals" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prefHiking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("profile_pref_hiking")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={5} {...field} data-testid="input-pref-hiking" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prefLodging"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{t("profile_pref_lodging")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={5} {...field} data-testid="input-pref-lodging" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saveMutation.isPending} data-testid="button-save-profile">
              <Save className="w-4 h-4 mr-1" />
              {saveMutation.isPending ? t("profile_saving") : t("profile_save")}
            </Button>
          </form>
        </Form>
      </Card>

      <NotificationSettings />
    </div>
  );
}

function NotificationSettings() {
  const { toast } = useToast();
  const { t } = useT();
  const [subscribing, setSubscribing] = useState(false);

  const { data: pushStatus, isLoading: statusLoading } = useQuery<{ subscribed: boolean }>({
    queryKey: ["/api/push/status"],
  });

  const [testSending, setTestSending] = useState(false);

  async function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)));
  }

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast({ title: t("push_not_supported"), variant: "destructive" });
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: t("push_permission_denied"), variant: "destructive" });
        setSubscribing(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidRes = await fetch("/api/push/vapid-key");
      const { publicKey } = await vapidRes.json();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await urlBase64ToUint8Array(publicKey),
      });

      const subJson = sub.toJSON();
      await apiRequest("POST", "/api/push/subscribe", {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/push/status"] });
      toast({ title: t("push_activated") });
    } catch (error) {
      console.error("Push subscribe error:", error);
      toast({ title: t("push_activate_error"), variant: "destructive" });
    }
    setSubscribing(false);
  }

  async function disablePush() {
    setSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await apiRequest("DELETE", "/api/push/subscribe");
      queryClient.invalidateQueries({ queryKey: ["/api/push/status"] });
      toast({ title: t("push_deactivated") });
    } catch (error) {
      toast({ title: t("push_deactivate_error"), variant: "destructive" });
    }
    setSubscribing(false);
  }

  async function sendTestPush() {
    setTestSending(true);
    try {
      await apiRequest("POST", "/api/push/test");
      toast({ title: t("push_test_sent") });
    } catch (error) {
      toast({ title: t("push_test_error"), variant: "destructive" });
    }
    setTestSending(false);
  }

  const isSubscribed = pushStatus?.subscribed || false;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-1.5" data-testid="text-notifications-title">
        <Bell className="w-4 h-4 text-primary" />
        {t("push_title")}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t("push_description")}
      </p>

      {statusLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : isSubscribed ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400" data-testid="text-push-enabled">
            <Bell className="w-4 h-4" />
            {t("push_enabled")}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestPush}
              disabled={testSending}
              data-testid="button-test-push"
            >
              {testSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Bell className="w-4 h-4 mr-1" />}
              {t("push_test")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disablePush}
              disabled={subscribing}
              data-testid="button-disable-push"
            >
              <BellOff className="w-4 h-4 mr-1" />
              {t("push_disable")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={enablePush}
          disabled={subscribing}
          data-testid="button-enable-push"
        >
          {subscribing ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              {t("push_enabling")}
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-1" />
              {t("push_enable")}
            </>
          )}
        </Button>
      )}
    </Card>
  );
}
