import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Activity } from "@shared/schema";
import { useT } from "@/lib/i18n";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const typeColors: Record<string, string> = {
  transport: "#3B82F6",
  meal: "#F97316",
  hike: "#22C55E",
  lodging: "#A855F7",
};

const typeKeys: Record<string, string> = {
  transport: "type_transport",
  meal: "type_meal",
  hike: "type_hike",
  lodging: "type_lodging",
};

function createColoredIcon(color: string) {
  return L.divIcon({
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

interface MapViewProps {
  activities: (Activity & { participantCount?: number })[];
  onActivityClick?: (id: number) => void;
  className?: string;
}

export function MapView({ activities, onActivityClick, className = "" }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { t } = useT();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([42.88, -8.54], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds: L.LatLngExpression[] = [];

    activities.forEach((act) => {
      if (act.lat && act.lng) {
        const color = typeColors[act.type] || "#3B82F6";
        const label = t(typeKeys[act.type] || "type_hike");
        const spotsLeft = (act.spots || 4) - (act.participantCount || 0);
        const spotsText = spotsLeft <= 0
          ? t("spots_full")
          : spotsLeft === 1
            ? t("spots_one", { count: 1 })
            : t("spots_other", { count: spotsLeft });
        const marker = L.marker([act.lat, act.lng], { icon: createColoredIcon(color) })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:180px;font-family:Inter,sans-serif;">
              <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${act.title}</div>
              <div style="font-size:12px;color:#666;margin-bottom:2px;">${label} &middot; ${act.city}</div>
              <div style="font-size:12px;color:#666;">${act.date}${act.time ? ` ${t("map_at")} ${act.time}` : ""}</div>
              <div style="font-size:11px;margin-top:4px;color:${spotsLeft <= 1 ? "#ef4444" : "#666"}">${spotsText}</div>
            </div>`
          );

        if (onActivityClick) {
          marker.on("click", () => onActivityClick(act.id));
        }

        bounds.push([act.lat, act.lng]);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50], maxZoom: 12 });
    }
  }, [activities, onActivityClick, t]);

  return <div ref={mapRef} className={`w-full h-full ${className}`} data-testid="map-container" />;
}
