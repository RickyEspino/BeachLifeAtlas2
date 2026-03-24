"use client";

import Link from "next/link";
import { deleteTrip, toggleFavorite } from "@/app/trips/actions";

import type { TripListItem } from "@/lib/atlas/get-trips";

interface TripCardProps {
  trip: TripListItem;
  premium?: boolean;
}

export default function TripCard({ trip, premium = false }: TripCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-[2rem] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        premium ? "min-h-[320px]" : ""
      }`}
    >
      <div
        className={`relative p-5 ${premium ? "min-h-[220px]" : ""}`}
        style={{
          background:
            premium
              ? "linear-gradient(135deg, rgba(253,230,138,.65), rgba(191,219,254,.65), rgba(216,180,254,.65))"
              : "linear-gradient(135deg, rgba(245,245,245,1), rgba(255,255,255,1))",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              {trip.zone}
            </p>
            <h3 className={`mt-2 font-semibold tracking-tight ${premium ? "text-3xl" : "text-xl"}`}>
              {trip.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(trip.id, !!trip.is_favorite)}
            className="rounded-full border bg-white/80 px-3 py-1 text-lg"
            aria-label="Toggle favorite"
          >
            {trip.is_favorite ? "⭐" : "☆"}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs capitalize">
            {trip.vibe ?? "fun"}
          </span>
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs capitalize">
            {trip.status ?? "published"}
          </span>
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs">
            {new Date(trip.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-5">
        <Link
          href={`/experience/${trip.id}`}
          className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Open
        </Link>

        <button
          type="button"
          onClick={() => deleteTrip(trip.id)}
          className="rounded-full border px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
