"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const vibes = ["fun", "chill", "romantic", "family", "foodie", "nightlife"];

export default function HomePage() {
  const [input, setInput] = useState("");
  const [vibe, setVibe] = useState("fun");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await fetch("/api/atlas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input, vibe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to build experience");
      }

      router.push(`/experience/${data.tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-4xl font-bold">Atlas 🌊</h1>

      <div className="flex flex-wrap gap-2">
        {vibes.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setVibe(item)}
            className={`rounded-full border px-4 py-2 ${
              vibe === item ? "font-semibold" : ""
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <textarea
        className="min-h-[120px] rounded-xl border p-4"
        placeholder="What are you in the mood for?"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="rounded-xl border px-4 py-3 font-semibold disabled:opacity-50"
      >
        {isLoading ? "Building..." : "Build My Experience"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
