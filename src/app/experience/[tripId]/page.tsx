import MapView from "@/components/map/map-view";
import { getTripWithNodes } from "@/lib/atlas/get-trip";
import { notFound } from "next/navigation";

interface ExperiencePageProps {
  params: Promise<{ tripId: string }>;
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { tripId } = await params;
  const exp = await getTripWithNodes(tripId);

  if (!exp) {
    notFound();
  }

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

      {exp.nodes.length > 0 ? <MapView nodes={exp.nodes} /> : null}
    </main>
  );
}
