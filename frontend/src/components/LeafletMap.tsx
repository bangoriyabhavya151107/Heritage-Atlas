"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngTuple, LeafletMouseEvent } from "leaflet";
import type { Coordinates } from "@/types/geography";

const INDIA_CENTER: LatLngTuple = [22.9734, 78.6569];
const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const tileUrl = process.env.NEXT_PUBLIC_OSM_TILE_URL?.trim() || OSM_TILE_URL;

interface LeafletMapProps {
  value: Coordinates | null;
  onChange: (coordinates: Coordinates) => void;
}

function ClickAndPin({ value, onChange }: LeafletMapProps) {
  const map = useMap();

  useMapEvents({
    click(event: LeafletMouseEvent) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  useEffect(() => {
    if (value) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 11), { animate: false });
    }
  }, [map, value]);

  if (!value) return null;
  return (
    <CircleMarker
      center={[value.lat, value.lng]}
      radius={9}
      pathOptions={{ color: "#FFFDF9", weight: 3, fillColor: "#C65D3B", fillOpacity: 1 }}
    >
      <Popup>Selected heritage location</Popup>
    </CircleMarker>
  );
}

export default function LeafletMap({ value, onChange }: LeafletMapProps) {
  return (
    <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom={false} className="h-full min-h-[18rem] w-full rounded-xl">
      <TileLayer
        url={tileUrl}
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      />
      <ClickAndPin value={value} onChange={onChange} />
    </MapContainer>
  );
}
