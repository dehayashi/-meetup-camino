export interface TransportCity {
  id: string;
  name: string;
}

export interface TransportRoute {
  id: string;
  from: string;
  to: string;
  label: string;
}

export const TRANSPORT_CITIES: TransportCity[] = [
  { id: "lisboa", name: "Lisboa" },
  { id: "porto", name: "Porto" },
  { id: "barcelos", name: "Barcelos" },
  { id: "tui", name: "Tui" },
  { id: "santiago", name: "Santiago de Compostela" },
  { id: "finisterra", name: "Finisterra" },
  { id: "madrid", name: "Madrid" },
  { id: "pamplona", name: "Pamplona" },
  { id: "sjpp", name: "Saint-Jean-Pied-de-Port" },
  { id: "estella", name: "Estella" },
  { id: "logrono", name: "Logroño" },
  { id: "burgos", name: "Burgos" },
  { id: "leon", name: "León" },
  { id: "astorga", name: "Astorga" },
  { id: "ponferrada", name: "Ponferrada" },
  { id: "sarria", name: "Sarria" },
];

export const TRANSPORT_ROUTES: TransportRoute[] = [
  { id: "madrid-pamplona", from: "Madrid", to: "Pamplona", label: "Madrid → Pamplona" },
  { id: "pamplona-sjpp", from: "Pamplona", to: "Saint-Jean-Pied-de-Port", label: "Pamplona → Saint-Jean-Pied-de-Port" },
  { id: "santiago-finisterra", from: "Santiago de Compostela", to: "Finisterra", label: "Santiago de Compostela → Finisterra" },
  { id: "santiago-madrid", from: "Santiago de Compostela", to: "Madrid", label: "Santiago de Compostela → Madrid" },
  { id: "lisboa-porto", from: "Lisboa", to: "Porto", label: "Lisboa → Porto" },
  { id: "porto-tui", from: "Porto", to: "Tui", label: "Porto → Tui" },
  { id: "barcelos-tui", from: "Barcelos", to: "Tui", label: "Barcelos → Tui" },
  { id: "tui-santiago", from: "Tui", to: "Santiago de Compostela", label: "Tui → Santiago de Compostela" },
];

export function getCityNames(): string[] {
  return TRANSPORT_CITIES.map((c) => c.name);
}

export function getRouteById(id: string): TransportRoute | undefined {
  return TRANSPORT_ROUTES.find((r) => r.id === id);
}
