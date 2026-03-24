"use client";

import { useAtlasStore } from "@/lib/store/useAtlasStore";
import MapView from "@/components/map/map-view";

export default function ExperiencePage() {
  const exp = useAtlasStore((s) => s.experience);

  if (!exp) return <div className="p-6">No experience yet</div>;

  return (
    <main className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{exp.title}</h1>

      <div className="grid gap-3">
        {exp.nodes.map((node) => (
          <div key={node.id} className="p-3 border rounded-lg">
            <strong>{node.role}</strong> — {node.name}
            <p className="text-sm text-gray-500">{node.description}</p>
          </div>
        ))}
      </div>

      <MapView nodes={exp.nodes} />
    </main>
  );
}
