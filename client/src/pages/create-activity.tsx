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

const cities = [
  "Porto", "Lisboa", "Saint-Jean-Pied-de-Port", "Pamplona", "Estella",
  "Logro\u00f1o", "Burgos", "Le\u00f3n", "Astorga", "Ponferrada",
  "Sarria", "Santiago de Compostela", "Fisterra",
];

const cityCoords: Record<string, { lat: number; lng: number }> = {
  "Porto": { lat: 41.1579, lng: -8.6291 },
  "Lisboa": { lat: 38.7223, lng: -9.1393 },
  "Saint-Jean-Pied-de-Port": { lat: 43.1633, lng: -1.2376 },
  "Pamplona": { lat: 42.8125, lng: -1.6458 },
  "Estella": { lat: 42.6714, lng: -2.0313 },
  "Logro\u00f1o": { lat: 42.4627, lng: -2.4446 },
  "Burgos": { lat: 42.3440, lng: -3.6969 },
  "Le\u00f3n": { lat: 42.5987, lng: -5.5671 },
  "Astorga": { lat: 42.4556, lng: -6.0567 },
  "Ponferrada": { lat: 42.5499, lng: -6.5985 },
  "Sarria": { lat: 42.7799, lng: -7.4148 },
  "Santiago de Compostela": { lat: 42.8782, lng: -8.5448 },
  "Fisterra": { lat: 42.9065, lng: -9.2655 },
};

const formSchema = z.object({
  title: z.string().min(3, "M\u00ednimo 3 caracteres"),
  description: z.string().optional(),
  type: z.enum(["transport", "meal", "hike", "lodging"]),
  city: z.string().min(1, "Selecione uma cidade"),
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().optional(),
  spots: z.coerce.number().min(2).max(20).default(4),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateActivity() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const coords = cityCoords[data.city] || { lat: 42.88, lng: -8.54 };
      const res = await apiRequest("POST", "/api/activities", {
        ...data,
        lat: coords.lat,
        lng: coords.lng,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Atividade criada!", description: "Sua atividade foi publicada." });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recommended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/mine"] });
      setLocation(`/activity/${data.id}`);
    },
    onError: () => {
      toast({ title: "Erro", description: "N\u00e3o foi poss\u00edvel criar a atividade.", variant: "destructive" });
    },
  });

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-serif text-xl font-bold" data-testid="text-create-title">Criar Atividade</h1>
      </div>

      <Card className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>T\u00edtulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dividir Uber para Le\u00f3n" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="transport">Transporte</SelectItem>
                      <SelectItem value="meal">Refei\u00e7\u00e3o</SelectItem>
                      <SelectItem value="hike">Passeio</SelectItem>
                      <SelectItem value="lodging">Hospedagem</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descri\u00e7\u00e3o (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes da atividade..." {...field} data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-city">
                          <SelectValue placeholder="Selecione" />
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

              <FormField
                control={form.control}
                name="spots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vagas</FormLabel>
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
                    <FormLabel>Data</FormLabel>
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
                    <FormLabel>Hor\u00e1rio (opcional)</FormLabel>
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
              {createMutation.isPending ? "Criando..." : "Criar Atividade"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
