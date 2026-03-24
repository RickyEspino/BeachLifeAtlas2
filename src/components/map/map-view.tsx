"use client";


import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type MapNode = {
  id: string;
  place_id?: string;
  name: string;
  role: string;
  description: string;
  lat: number;
  lng: number;
  points_reward?: number;
  sort_order?: number;
};

type UserLocation = {
  lat: number;
  lng: number;
};

type MapViewProps = {
  nodes: MapNode[];
  userLocation?: UserLocation | null;
  selectedStopId?: string | null;
  heightClassName?: string;
};

export default function MapView({
  nodes,
  userLocation = null,
  selectedStopId = null,
  heightClassName = "h-[520px]",
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
      return () => {
        mountedRef.current = false;
      };
    }

    mapboxgl.accessToken = token;

    const validNodes = nodes.filter(
      (node) =>
        typeof node.lat === "number" &&
        typeof node.lng === "number" &&
        !Number.isNaN(node.lat) &&
        !Number.isNaN(node.lng)
    );

    if (!mapContainerRef.current || validNodes.length === 0) {
      return () => {
        mountedRef.current = false;
      };
    }

    let map: mapboxgl.Map | null = null;

    const clearMarkers = () => {
      for (const marker of markersRef.current) {
        try {
          marker.remove();
        } catch (error) {
          console.error("Marker cleanup error:", error);
        }
      }
      markersRef.current = [];
    };

    const safeRemoveMap = () => {
      clearMarkers();

      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error("Map cleanup error:", error);
        } finally {
          mapRef.current = null;
        }
      }
    };

    try {
      safeRemoveMap();

      const initialCenter: [number, number] = userLocation
        ? [userLocation.lng, userLocation.lat]
        : [validNodes[0].lng, validNodes[0].lat];

      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: initialCenter,
        zoom: 13,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        if (!mountedRef.current || !mapRef.current) return;

        try {
          const liveMap = mapRef.current;
          const bounds = new mapboxgl.LngLatBounds();

          // User location marker
          if (userLocation) {
            const userEl = document.createElement("div");
            userEl.className =
              "flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-[10px] font-black text-white shadow-lg";
            userEl.textContent = "YOU";

            const userMarker = new mapboxgl.Marker({ element: userEl })
              .setLngLat([userLocation.lng, userLocation.lat])
              .setPopup(new mapboxgl.Popup().setText("Your location"))
              .addTo(liveMap);

            markersRef.current.push(userMarker);
            bounds.extend([userLocation.lng, userLocation.lat]);
          }

          // Numbered stop markers
          validNodes.forEach((node, index) => {
            const isSelected = selectedStopId === node.id;

            const markerEl = document.createElement("button");
            markerEl.type = "button";
            markerEl.className = [
              "flex h-11 w-11 items-center justify-center rounded-full border-4 border-white text-sm font-black shadow-lg transition-transform",
              isSelected ? "bg-black text-white scale-110" : "bg-white text-black",
            ].join(" ");

            markerEl.textContent = String(index + 1);
            markerEl.setAttribute("aria-label", `${index + 1}. ${node.name}`);

            const popupHtml = `
              <div style="min-width:180px">
                <div style="font-weight:700; margin-bottom:4px;">${index + 1}. ${node.name}</div>
                <div style="font-size:12px; opacity:.75; margin-bottom:6px;">${node.role}</div>
                <div style="font-size:13px;">${node.description ?? ""}</div>
              </div>
            `;

            const marker = new mapboxgl.Marker({ element: markerEl })
              .setLngLat([node.lng, node.lat])
              .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(popupHtml))
              .addTo(liveMap);

            markersRef.current.push(marker);
            bounds.extend([node.lng, node.lat]);
          });

          // Route line
          if (validNodes.length > 1) {
            const coordinates = validNodes.map((node) => [node.lng, node.lat]);

            if (liveMap.getLayer("experience-route-line")) {
              liveMap.removeLayer("experience-route-line");
            }

            if (liveMap.getSource("experience-route")) {
              liveMap.removeSource("experience-route");
            }

            liveMap.addSource("experience-route", {
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

            liveMap.addLayer({
              id: "experience-route-line",
              type: "line",
              source: "experience-route",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#111827",
                "line-width": 4,
                "line-opacity": 0.7,
              },
            });
          }

          if (!bounds.isEmpty()) {
            liveMap.fitBounds(bounds, {
              padding: 70,
              maxZoom: 14,
              duration: 800,
            });
          }
        } catch (error) {
          console.error("Map render error:", error);
        }
      });
    } catch (error) {
      console.error("Map init error:", error);
    }

    return () => {
      mountedRef.current = false;
      clearMarkers();

      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error("Map cleanup error:", error);
        } finally {
          mapRef.current = null;
        }
      }
    };
  }, [nodes, userLocation, selectedStopId]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full overflow-hidden rounded-[2rem] ${heightClassName}`}
    />
  );
}
