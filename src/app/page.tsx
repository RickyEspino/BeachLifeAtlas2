"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAtlasStore, AtlasState } from "@/lib/store/useAtlasStore";

export default function HomePage() {
  const [input, setInput] = useState("");
  const router = useRouter();
  const setExperience = useAtlasStore((s: AtlasState) => s.setExperience);

  const handleSubmit = async () => {
    const res = await fetch("/api/atlas", {
      method: "POST",
      body: JSON.stringify({ input }),
    });

    const data = await res.json();
    setExperience(data);
    router.push("/experience");
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
    </main>
  );
}
