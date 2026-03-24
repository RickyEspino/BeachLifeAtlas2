"use client";

import { useMemo, useState } from "react";
import QuickFindCard from "@/components/quick-find/quick-find-card";
import QuickFindMap from "@/components/map/quick-find-map";

type QuickFindResult = {
  id: string;
  place_id: string | null;
  name: string;
  category: string | null;
  description: string | null;
  lat: number;
  lng: number;
  points_reward: number | null;
  sort_order: number;
};

type QuickSearch = {
  id: string;
  query: string | null;
  vibe: string | null;
  distance: string | null;
  anchor_mode: string | null;
  selected_zone: string | null;
  user_lat?: number | null;
  user_lng?: number | null;
  created_at: string;
  results: QuickFindResult[];
};

type SortMode = "best-match" | "points" | "alphabetical";

export default function QuickFindClient({ search }: { search: QuickSearch }) {
  const [sortMode, setSortMode] = useState<SortMode>("best-match");
  const [selectedId, setSelectedId] = useState<string | null>(
    search.results[0]?.id ?? null
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [likedCategories, setLikedCategories] = useState<string[]>([]);

  const rerankedResults = useMemo(() => {
    const items = [...search.results];

    if (likedCategories.length > 0) {
      items.sort((a, b) => {
        const aBoost = a.category && likedCategories.includes(a.category) ? 1 : 0;
        const bBoost = b.category && likedCategories.includes(b.category) ? 1 : 0;
        if (aBoost !== bBoost) return bBoost - aBoost;
        return a.sort_order - b.sort_order;
      });
    }

    if (sortMode === "points") {
      items.sort((a, b) => (b.points_reward ?? 0) - (a.points_reward ?? 0));
    } else if (sortMode === "alphabetical") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      items.sort((a, b) => a.sort_order - b.sort_order);
    }

    return items;
  }, [search.results, sortMode, likedCategories]);

  const selectedResult =
    rerankedResults.find((item) => item.id === selectedId) ?? rerankedResults[0] ?? null;

  const handleMoreLikeThis = (category: string | null) => {
    if (!category) return;

    setLikedCategories((current) =>
      current.includes(category)
        ? current
        : [...current, category]
    );
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <section className="rounded-[2.5rem] border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
          Quick Find
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          {search.query || "Top nearby picks"}
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-600">
          Fast answers for tacos, coffee, dessert, drinks, and nearby favorites.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSortMode("best-match")}
            className={`rounded-full border px-4 py-2 text-sm ${
              sortMode === "best-match" ? "bg-black text-white" : "hover:bg-neutral-50"
            }`}
          >
            Best match
          </button>
          <button
            type="button"
            onClick={() => setSortMode("points")}
            className={`rounded-full border px-4 py-2 text-sm ${
              sortMode === "points" ? "bg-black text-white" : "hover:bg-neutral-50"
            }`}
          >
            Highest points
          </button>
          <button
            type="button"
            onClick={() => setSortMode("alphabetical")}
            className={`rounded-full border px-4 py-2 text-sm ${
              sortMode === "alphabetical" ? "bg-black text-white" : "hover:bg-neutral-50"
            }`}
          >
            A–Z
          </button>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_.95fr]">
        <section className="space-y-4">
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2 snap-x snap-mandatory">
              {rerankedResults.map((item, index) => (
                <div
                  key={item.id}
                  className="min-w-[320px] max-w-[360px] snap-start"
                >
                  <QuickFindCard
                    item={item}
                    index={index}
                    isSelected={selectedId === item.id}
                    isExpanded={expandedId === item.id}
                    onSelect={() => setSelectedId(item.id)}
                    onToggleExpand={() =>
                      setExpandedId((current) =>
                        current === item.id ? null : item.id
                      )
                    }
                    onMoreLikeThis={() => handleMoreLikeThis(item.category)}
                  />
                </div>
              ))}
            </div>
          </div>

          {likedCategories.length > 0 ? (
            <div className="rounded-2xl border bg-white p-4 text-sm text-neutral-600">
              Re-ranked with preference for: {" "}
              <span className="font-medium">{likedCategories.join(", ")}</span>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
              Live map
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Nearby picks</h2>

            <div className="mt-5">
              <QuickFindMap
                results={rerankedResults}
                selectedId={selectedResult?.id ?? null}
                userLocation={
                  search.user_lat != null && search.user_lng != null
                    ? {
                        lat: search.user_lat,
                        lng: search.user_lng,
                      }
                    : null
                }
                onSelect={(id) => {
                  setSelectedId(id);
                  setExpandedId(id);
                }}
              />
            </div>
          </section>

          {selectedResult ? (
            <section className="rounded-[2rem] border bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
                Selected
              </p>
              <h3 className="mt-2 text-2xl font-semibold">{selectedResult.name}</h3>
              <p className="mt-3 text-neutral-700">
                {selectedResult.description ?? ""}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border px-3 py-1 text-sm capitalize">
                  {selectedResult.category ?? "place"}
                </span>
                <span className="rounded-full border px-3 py-1 text-sm">
                  +{selectedResult.points_reward ?? 0} BeachPoints
                </span>
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
