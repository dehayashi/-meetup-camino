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
import { LogOut, Save, X, Plus } from "lucide-react";
import { useState } from "react";
import type { PilgrimProfile } from "@shared/schema";

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
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

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
    } else if (user) {
      form.setValue("displayName", [user.firstName, user.lastName].filter(Boolean).join(" ") || "");
    }
  }, [profile, user]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("POST", "/api/profile", {
        ...data,
        cities: selectedCities,
        photoUrl: user?.profileImageUrl || "",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Perfil salvo!" });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: () => {
      toast({ title: "Erro ao salvar perfil", variant: "destructive" });
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
        <h1 className="font-serif text-xl font-bold" data-testid="text-profile-title">Meu Perfil</h1>
        <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-1" />
          Sair
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Avatar className="w-14 h-14">
          <AvatarImage src={user?.profileImageUrl || ""} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
            {user?.firstName?.charAt(0) || "P"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
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
                  <FormLabel>Nome de Exibi\u00e7\u00e3o</FormLabel>
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
                    <FormLabel>Idioma</FormLabel>
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
                    <FormLabel>Nacionalidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Brasil" {...field} data-testid="input-nationality" />
                    </FormControl>
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
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Conte um pouco sobre voc\u00ea..." {...field} data-testid="input-bio" />
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
                    <FormLabel>In\u00edcio da Viagem</FormLabel>
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
                    <FormLabel>Fim da Viagem</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-travel-end" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Cidades do Caminho</FormLabel>
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
              <FormLabel>Prefer\u00eancias (0-5)</FormLabel>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <FormField
                  control={form.control}
                  name="prefTransport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Transporte</FormLabel>
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
                      <FormLabel className="text-xs text-muted-foreground">Refei\u00e7\u00f5es</FormLabel>
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
                      <FormLabel className="text-xs text-muted-foreground">Caminhada</FormLabel>
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
                      <FormLabel className="text-xs text-muted-foreground">Hospedagem</FormLabel>
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
              {saveMutation.isPending ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
