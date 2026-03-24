"use client";

import { useState } from "react";
import { updateStopNotes, updateStopRating } from "@/app/trips/actions";

export default function StopRating({
  tripNodeId,
  rating,
  notes,
}: {
  tripNodeId: string;
  rating: number | null;
  notes: string | null;
}) {
  const [draftNotes, setDraftNotes] = useState(notes ?? "");

  return (
    <div className="mt-4 rounded-2xl border bg-neutral-50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Rate this stop</span>

        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => updateStopRating(tripNodeId, star)}
              className="text-xl"
              aria-label={`Rate ${star} stars`}
            >
              {star <= (rating ?? 0) ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={draftNotes}
        onChange={(e) => setDraftNotes(e.target.value)}
        placeholder="Notes about this stop..."
        className="mt-3 min-h-[90px] w-full rounded-xl border bg-white p-3 text-sm outline-none"
      />

      <div className="mt-3">
        <button
          type="button"
          onClick={() => updateStopNotes(tripNodeId, draftNotes)}
          className="rounded-full border px-4 py-2 text-sm hover:bg-white"
        >
          Save notes
        </button>
      </div>
    </div>
  );
}
