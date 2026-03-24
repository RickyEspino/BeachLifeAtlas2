"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Result = {
  id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  points_reward: number | null;
  category: string | null;
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function QuickFindMap({
  results,
  selectedId,
  userLocation,
  onSelect,
}: {
  results: Result[];
  selectedId: string | null;
  userLocation: { lat: number; lng: number } | null;
  onSelect: (id: string) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;
    if (!results.length) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current = [];
    }

    const center = userLocation
      ? [userLocation.lng, userLocation.lat]
      : [results[0].lng, results[0].lat];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: center as [number, number],
      zoom: 13,
    });

    mapRef.current = map;

    map.on("load", () => {
      const bounds = new mapboxgl.LngLatBounds();

      if (userLocation) {
        const userEl = document.createElement("div");
        userEl.className =
          "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black text-xs font-semibold text-white shadow-lg";
        userEl.innerText = "YOU";

        const userMarker = new mapboxgl.Marker({ element: userEl })
          .setLngLat([userLocation.lng, userLocation.lat])
          .setPopup(new mapboxgl.Popup().setText("Your location"))
          .addTo(map);

        markersRef.current.push(userMarker);
        bounds.extend([userLocation.lng, userLocation.lat]);
      }

      results.forEach((item, index) => {
        const isSelected = selectedId === item.id;

        const el = document.createElement("div");
        el.className = [
          "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-sm font-semibold shadow-lg cursor-pointer",
          isSelected ? "bg-black text-white" : "bg-white text-black",
        ].join(" ");

        el.innerText = String(index + 1);

        el.addEventListener("click", () => onSelect(item.id));

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([item.lng, item.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<strong>${index + 1}. ${item.name}</strong><br/>${item.category ?? "place"}`
            )
          )
          .addTo(map);

        markersRef.current.push(marker);
        bounds.extend([item.lng, item.lat]);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60 });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [results, selectedId, userLocation, onSelect]);

  return <div ref={mapContainerRef} className="h-[480px] w-full rounded-2xl" />;
}
