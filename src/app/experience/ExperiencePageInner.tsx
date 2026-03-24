"use client";
import { useSearchParams } from "next/navigation";
import MapView from "@/components/map/map-view";

import type { AtlasExperience } from "@/types/atlas";

export default function ExperiencePageInner() {
  const params = useSearchParams();
  const data = params.get("data");

  if (!data) return <div className="p-6">No experience yet</div>;

  const exp: AtlasExperience = JSON.parse(decodeURIComponent(data));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{exp.title}</h1>
        <p className="text-sm opacity-70">Zone: {exp.zone}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {exp.nodes.map((node) => (
          <div key={node.id} className="rounded-2xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <strong>{node.role}</strong>
              <span>+{node.points_reward ?? 0} BeachPoints</span>
            </div>
            <div className="font-semibold">{node.name}</div>
            <p className="text-sm opacity-70">{node.description}</p>
          </div>
        ))}
      </div>

      <MapView
        nodes={exp.nodes.map((node, index) => ({
          ...node,
          id: node.id ?? node.place_id ?? `stop-${index}`,
        }))}
      />
    </main>
  );
}
