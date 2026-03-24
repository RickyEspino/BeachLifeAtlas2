"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { AtlasNode } from "@/types/atlas";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapView({ nodes }: { nodes: AtlasNode[] }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!nodes?.length) return;

    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [nodes[0].lng, nodes[0].lat],
      zoom: 13,
    });

    nodes.forEach((node) => {
      new mapboxgl.Marker()
        .setLngLat([node.lng, node.lat])
        .setPopup(new mapboxgl.Popup().setText(node.name))
        .addTo(map);
    });

    mapRef.current = map;

    return () => map.remove();
  }, [nodes]);

  return <div id="map" className="w-full h-[400px] rounded-xl" />;
}
