"use client";

import { useMemo, useState } from "react";
import type { TripListItem } from "@/lib/atlas/get-trips";
import TripCard from "@/components/trips/trip-card";

const vibes = ["all", "fun", "chill", "romantic", "family", "foodie", "nightlife"];

export default function TripsDashboardClient({
  trips,
}: {
  trips: TripListItem[];
}) {
  const [search, setSearch] = useState("");
  const [vibe, setVibe] = useState("all");

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();

    return trips
      .filter((trip) => {
        if (vibe !== "all" && (trip.vibe ?? "fun") !== vibe) return false;

        if (!query) return true;

        const haystack = [
          trip.title,
          trip.zone,
          trip.vibe ?? "",
          trip.status ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => {
        if (!!a.is_favorite !== !!b.is_favorite) {
          return a.is_favorite ? -1 : 1;
        }

        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [trips, search, vibe]);

  const favoriteTrips = filteredTrips.filter((trip) => trip.is_favorite);
  const regularTrips = filteredTrips.filter((trip) => !trip.is_favorite);

  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] border bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            Editorial archive
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
            My Trips
          </h1>
          <p className="mt-3 max-w-2xl text-base text-neutral-600">
            Saved escapes, late-night builds, favorite routes, and future drafts.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.5fr_auto] md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, vibe, or zone..."
            className="w-full rounded-full border bg-white px-5 py-3 text-sm outline-none transition focus:ring-2"
          />

          <div className="flex flex-wrap gap-2">
            {vibes.map((item) => {
              const active = vibe === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setVibe(item)}
                  className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                    active ? "bg-black text-white" : "bg-white hover:bg-neutral-50"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {favoriteTrips.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
              Favorite collection
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Pinned escapes</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {favoriteTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} premium />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            Recent builds
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Latest routes</h2>
        </div>

        {regularTrips.length === 0 && favoriteTrips.length === 0 ? (
          <div className="rounded-[2rem] border bg-white p-8 text-neutral-600">
            No trips yet. Time to build something dangerous.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {regularTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
