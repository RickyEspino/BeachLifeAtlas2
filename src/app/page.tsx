"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAtlasStore, AtlasState } from "@/lib/store/useAtlasStore";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [vibe, setVibe] = useState("fun");
  const router = useRouter();

  const handleSubmit = async () => {
    const res = await fetch("/api/atlas", {
      method: "POST",
      body: JSON.stringify({ input }),
    });

    const data = await res.json();
    const encoded = encodeURIComponent(JSON.stringify(data));
    router.push(`/experience?data=${encoded}`);
  };

  return (
    <main className="p-6 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Atlas 🌊</h1>

      <input
        className="border p-3 rounded-lg"
        placeholder="What do you feel like doing?"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white p-3 rounded-lg"
      >
        Build My Experience
      </button>
      <div className="flex flex-wrap gap-2">
        {["fun", "chill", "romantic", "family", "foodie", "nightlife"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setVibe(item)}
            className={`rounded-full border px-4 py-2 ${vibe === item ? "font-semibold" : ""}`}
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
    </main>
  );
}
