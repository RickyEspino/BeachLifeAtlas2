"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
});

interface MapClientProps {
  nodes: Array<{
    id: string;
    place_id?: string;
    name: string;
    role: string;
    description: string;
    lat: number;
    lng: number;
    points_reward: number;
    category?: string;
  }>;
}

export default function MapClient(props: MapClientProps) {
  return <MapView {...props} />;
}
