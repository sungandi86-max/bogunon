"use client";

import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import { useEffect, useRef } from "react";

import type { ProjectPlaceRow } from "@/types/database";

export function ProjectPlaceMap({ places, selectedId, onSelect }: {
  readonly places: readonly ProjectPlaceRow[];
  readonly selectedId?: string;
  readonly onSelect: (placeId: string) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const markers: Marker[] = [];
    let route: Polyline | undefined;
    void import("leaflet").then((leaflet) => {
      const element = elementRef.current;
      if (!element || cancelled) return;
      const map = mapRef.current ?? leaflet.map(element, { zoomControl: true }).setView([36.4, 127.8], 6);
      mapRef.current = map;
      if (!map.getPane("tilePane")?.children.length) {
        leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
      }
      const located = places.filter((place) => place.latitude !== null && place.longitude !== null);
      located.forEach((place, index) => {
        if (place.latitude === null || place.longitude === null) return;
        const marker = leaflet.marker([place.latitude, place.longitude], {
          icon: leaflet.divIcon({
            className: "project-place-marker",
            html: `<span><b>${index + 1}</b></span>`,
            iconAnchor: [15, 34],
            iconSize: [30, 34],
          }),
          title: place.name,
        }).addTo(map).on("click", () => onSelect(place.id));
        marker.bindTooltip(place.name, { direction: "top", offset: [0, -28] });
        if (place.id === selectedId) marker.openTooltip();
        markers.push(marker);
      });
      const coordinates = located.flatMap((place) => place.latitude === null || place.longitude === null ? [] : [[place.latitude, place.longitude] as [number, number]]);
      if (coordinates.length > 1) route = leaflet.polyline(coordinates, { color: "#178f80", opacity: 0.75, weight: 3 }).addTo(map);
      if (coordinates.length > 0) map.fitBounds(leaflet.latLngBounds(coordinates).pad(0.18), { maxZoom: 14 });
      window.setTimeout(() => map.invalidateSize(), 0);
    });
    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      route?.remove();
    };
  }, [onSelect, places, selectedId]);

  useEffect(() => () => {
    mapRef.current?.remove();
    mapRef.current = undefined;
  }, []);

  return <div aria-label="프로젝트 장소 지도" className="project-place-map" ref={elementRef} />;
}
