"use client";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import type { RecordOut } from "@/types/api";

const GUJARAT_CENTER: LatLngTuple = [22.55, 71.5];
const OSM_TILE_URL = process.env.NEXT_PUBLIC_OSM_TILE_URL?.trim() || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TYPE_COLORS: Record<NonNullable<RecordOut["monument_type"]>, string> = {
  stepwell: "#C65D3B",
  fort: "#7A3C2B",
  temple: "#1F2A5A",
  mosque: "#557A57",
  craft: "#9A6B2F",
  other: "#625E58",
};

type SelectRecord = (record: RecordOut) => void;

interface ExploreMapProps {
  records: RecordOut[];
  selectedId: string | null;
  activeIds: string[] | null;
  hoveredId: string | null;
  onSelect: SelectRecord;
}

interface MapGroup {
  records: RecordOut[];
  position: LatLngTuple;
}

function markerColor(type: RecordOut["monument_type"]): string {
  return type ? TYPE_COLORS[type] : TYPE_COLORS.other;
}

function groupRecords(records: RecordOut[], zoom: number): MapGroup[] {
  const precision = zoom < 7 ? 0.55 : zoom < 9 ? 0.2 : 0;
  const groups = new Map<string, RecordOut[]>();
  for (const record of records) {
    if (record.lat === null || record.lng === null) continue;
    const key = precision === 0 ? record.id : `${Math.round(record.lat / precision)}:${Math.round(record.lng / precision)}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  return Array.from(groups.values()).map((group) => {
    const points = group.flatMap((record) => record.lat === null || record.lng === null ? [] : [[record.lat, record.lng] as const]);
    const lat = points.reduce((sum, point) => sum + point[0], 0) / points.length;
    const lng = points.reduce((sum, point) => sum + point[1], 0) / points.length;
    return { records: group, position: [lat, lng] as LatLngTuple };
  });
}

function MapController({ records, selectedId }: Pick<ExploreMapProps, "records" | "selectedId">) {
  const map = useMap();

  useEffect(() => {
    const mapped = records.filter((record) => record.lat !== null && record.lng !== null);
    if (mapped.length > 1) {
      const points = mapped.map((record) => [record.lat as number, record.lng as number] as LatLngTuple);
      map.fitBounds(points as LatLngBoundsExpression, { padding: [48, 48], maxZoom: 11, animate: false });
    } else if (mapped.length === 1 && mapped[0] && mapped[0].lat !== null && mapped[0].lng !== null) {
      map.setView([mapped[0].lat, mapped[0].lng], 10, { animate: false });
    } else {
      map.setView(GUJARAT_CENTER, 7, { animate: false });
    }
  }, [map, records]);

  useEffect(() => {
    const selected = records.find((record) => record.id === selectedId);
    if (selected?.lat !== null && selected?.lat !== undefined && selected.lng !== null) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 11), { duration: 0.55 });
    }
  }, [map, records, selectedId]);

  return null;
}

function PinLayer({ records, selectedId, activeIds, hoveredId, onSelect }: ExploreMapProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const groups = useMemo(() => groupRecords(records, zoom), [records, zoom]);

  return (
    <>
      {groups.map((group) => {
        if (group.records.length > 1) {
          const clusterIcon = L.divIcon({
            className: "atlas-cluster-icon",
            html: `<span class="atlas-cluster">${group.records.length}</span>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });
          return (
            <Marker
              key={`cluster-${group.records.map((record) => record.id).sort().join("-")}`}
              position={group.position}
              icon={clusterIcon}
              title={`${group.records.length} heritage records. Zoom in to separate pins.`}
              keyboard
              eventHandlers={{ click: () => map.setView(group.position, Math.min(12, map.getZoom() + 3), { animate: true }) }}
            />
          );
        }
        const record = group.records[0];
        if (!record) return null;
        const color = markerColor(record.monument_type);
        const icon = L.divIcon({
          className: "atlas-pin-icon",
          html: `<span class="atlas-pin${record.id === selectedId ? " atlas-pin-selected" : ""}" style="--pin-color:${color}"></span>`,
          iconSize: [30, 36],
          iconAnchor: [15, 34],
        });
        const isMatch = activeIds === null || activeIds.includes(record.id);
        const opacity = hoveredId ? (hoveredId === record.id ? 1 : 0.24) : isMatch ? 1 : 0.3;
        return (
          <Marker
            key={record.id}
            position={group.position}
            icon={icon}
            title={record.title || record.place_name || "Heritage record"}
            alt={`Map pin: ${record.title || record.place_name || "Heritage record"}`}
            opacity={opacity}
            keyboard
            eventHandlers={{ click: () => onSelect(record) }}
          />
        );
      })}
    </>
  );
}

export default function ExploreMapClient(props: ExploreMapProps) {
  return (
    <MapContainer center={GUJARAT_CENTER} zoom={7} scrollWheelZoom className="h-full min-h-[32rem] w-full">
      <TileLayer
        url={OSM_TILE_URL}
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      />
      <MapController records={props.records} selectedId={props.selectedId} />
      <PinLayer {...props} />
    </MapContainer>
  );
}
