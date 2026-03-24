// NO "use client" here
import MapClient from "@/components/map/map-client";
import { notFound } from "next/navigation";
import { getQuickSearchById } from "@/lib/atlas/get-quick-search";

interface QuickFindPageProps {
  params: Promise<{ searchId: string }>;
}

export default async function QuickFindPage({ params }: QuickFindPageProps) {
  const { searchId } = await params;
  const search = await getQuickSearchById(searchId);

  if (!search) {
    notFound();
  }

  const mapNodes = search.results.map((item) => ({
    id: item.id,
    place_id: item.place_id ?? undefined,
    name: item.name,
    role: "PICK",
    description: item.description ?? "",
    lat: item.lat,
    lng: item.lng,
    points_reward: item.points_reward ?? 0,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <section className="rounded-[2.5rem] border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
          Quick Find
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {search.query || "Top nearby picks"}
        </h1>
        <p className="mt-3 text-neutral-600">
          Fast answers for food, drinks, dessert, coffee, and nearby spots.
        </p>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_.95fr]">
        <section className="space-y-5">
          {search.results.map((item, index) => (
            <article
              key={item.id}
              className="rounded-[2rem] border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                    Pick {index + 1}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">{item.name}</h2>
                </div>

                <span className="rounded-full border px-3 py-1 text-sm capitalize">
                  {item.category ?? "place"}
                </span>
              </div>

              <p className="mt-4 text-neutral-700">{item.description ?? ""}</p>

              <div className="mt-4">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm">
                  +{item.points_reward ?? 0} BeachPoints
                </span>
              </div>
            </article>
          ))}
        </section>

        <aside className="rounded-[2rem] border bg-white p-5 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            Map preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Nearby picks</h2>

          <div className="mt-5">
            {mapNodes.length > 0 ? (
              <MapClient nodes={mapNodes} />
            ) : (
              <div className="rounded-2xl border p-4 text-sm text-neutral-600">
                Map unavailable.
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
