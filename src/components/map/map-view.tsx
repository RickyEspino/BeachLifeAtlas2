"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { AtlasNode } from "@/types/atlas";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapView({ nodes }: { nodes: AtlasNode[] }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !nodes?.length) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [nodes[0].lng, nodes[0].lat],
      zoom: 13,
    });

    mapRef.current = map;

    map.on("load", () => {
      nodes.forEach((node) => {
        new mapboxgl.Marker()
          .setLngLat([node.lng, node.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<strong>${node.name}</strong><br/>${node.role}`
            )
          )
          .addTo(map);
      });

      const coordinates = nodes.map((node) => [node.lng, node.lat]);

      map.addSource("experience-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      });

      map.addLayer({
        id: "experience-route-line",
        type: "line",
        source: "experience-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-width": 5,
        },
      });

      const bounds = new mapboxgl.LngLatBounds();

      nodes.forEach((node) => bounds.extend([node.lng, node.lat]));
      map.fitBounds(bounds, { padding: 60 });
    });

    return () => {
      map.remove();
    };
  }, [nodes]);

  return <div ref={mapContainerRef} className="h-[420px] w-full rounded-2xl" />;
}
