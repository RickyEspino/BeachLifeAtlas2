"use client";

import Link from "next/link";
import { deleteTrip, toggleFavorite } from "@/app/trips/actions";

type Trip = {
  id: string;
  title: string;
  zone: string;
  vibe: string | null;
  created_at: string;
  is_favorite: boolean | null;
};

export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{trip.title}</h2>

        <button
          onClick={() => toggleFavorite(trip.id, !!trip.is_favorite)}
          className="text-xl"
        >
          {trip.is_favorite ? "⭐" : "☆"}
        </button>
      </div>

      <p className="text-sm opacity-70">
        {trip.zone} • {trip.vibe ?? "fun"}
      </p>

      <p className="text-xs opacity-50">
        {new Date(trip.created_at).toLocaleString()}
      </p>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/experience/${trip.id}`}
          className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-100"
        >
          Open
        </Link>

        <button
          onClick={() => deleteTrip(trip.id)}
          className="rounded-xl border px-3 py-1 text-sm text-red-500 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
