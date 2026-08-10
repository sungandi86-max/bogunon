"use client";

import type { Map as LeafletMap, Marker, Polyline, TileLayer } from "leaflet";
import { useEffect, useRef } from "react";

import { groupProjectPlacesByDay, type ProjectMapViewport } from "@/lib/projects/places";
import type { ProjectPlaceRow } from "@/types/database";

const ROUTE_COLOR_TOKENS = ["--action-700", "--school", "--warning", "--info", "--danger"] as const;

export function ProjectPlaceMap({ fallbackViewport, places, selectedId, onSelect }: {
  readonly fallbackViewport: ProjectMapViewport;
  readonly places: readonly ProjectPlaceRow[];
  readonly selectedId?: string;
  readonly onSelect: (placeId: string) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | undefined>(undefined);
  const tileLayerRef = useRef<TileLayer | undefined>(undefined);
  const markerRefs = useRef(new Map<string, Marker>());
  const lastViewportKeyRef = useRef("uninitialized");

  useEffect(() => {
    let cancelled = false;
    const markers: Marker[] = [];
    const routes: Polyline[] = [];
    void import("leaflet").then((leaflet) => {
      const element = elementRef.current;
      if (!element || cancelled) return;
      const map = mapRef.current ?? leaflet.map(element, { zoomControl: true }).setView([...fallbackViewport.center], fallbackViewport.zoom);
      mapRef.current = map;
      if (!tileLayerRef.current) {
        tileLayerRef.current = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
      }
      markerRefs.current.clear();
      const located = places.filter((place) => place.latitude !== null && place.longitude !== null);
      const groups = groupProjectPlacesByDay(located);
      groups.forEach((group, groupIndex) => {
        const coordinates: [number, number][] = [];
        group.places.forEach((place, index) => {
          if (place.latitude === null || place.longitude === null) return;
          coordinates.push([place.latitude, place.longitude]);
          const marker = leaflet.marker([place.latitude, place.longitude], {
            icon: leaflet.divIcon({
              className: "project-place-marker",
              html: `<span><b>${index + 1}</b></span>`,
              iconAnchor: [15, 34],
              iconSize: [30, 34],
            }),
            title: place.name,
          }).addTo(map).on("click", () => onSelect(place.id));
          const popup = document.createElement("div");
          const name = document.createElement("strong");
          name.textContent = place.name;
          const detail = document.createElement("span");
          detail.textContent = `${place.visited_time?.slice(0, 5) ?? "시간 미정"} · ${place.is_visited ? "방문 완료" : "방문 예정"}`;
          popup.append(name, detail);
          marker.bindPopup(popup, { closeButton: false, offset: [0, -24] });
          markers.push(marker);
          markerRefs.current.set(place.id, marker);
        });
        if (coordinates.length > 1) {
          const color = getComputedStyle(element).getPropertyValue(ROUTE_COLOR_TOKENS[groupIndex % ROUTE_COLOR_TOKENS.length] ?? "--action-700").trim();
          routes.push(leaflet.polyline(coordinates, { color, opacity: 0.76, weight: 3 }).addTo(map));
        }
      });
      const coordinates = located.flatMap((place) => place.latitude === null || place.longitude === null ? [] : [[place.latitude, place.longitude] as [number, number]]);
      const viewportKey = coordinates.map((coordinate) => coordinate.join(",")).join("|") || `fallback:${fallbackViewport.center.join(",")}:${fallbackViewport.zoom}`;
      if (viewportKey !== lastViewportKeyRef.current) {
        if (coordinates.length > 1) map.fitBounds(leaflet.latLngBounds(coordinates).pad(0.18), { maxZoom: 14 });
        else if (coordinates.length === 1 && coordinates[0]) map.setView(coordinates[0], 13);
        else map.setView([...fallbackViewport.center], fallbackViewport.zoom);
        lastViewportKeyRef.current = viewportKey;
      }
      if (selectedId) {
        const selectedMarker = markerRefs.current.get(selectedId);
        selectedMarker?.openPopup();
        selectedMarker?.getElement()?.classList.add("is-selected");
      }
      window.setTimeout(() => map.invalidateSize(), 0);
    });
    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      routes.forEach((route) => route.remove());
    };
  }, [fallbackViewport, onSelect, places, selectedId]);

  useEffect(() => () => {
    mapRef.current?.remove();
    mapRef.current = undefined;
    tileLayerRef.current = undefined;
  }, []);

  return <div aria-label="프로젝트 장소 지도" className="project-place-map" ref={elementRef} />;
}
