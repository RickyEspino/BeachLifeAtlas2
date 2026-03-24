"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const vibes = ["fun", "chill", "romantic", "family", "foodie", "nightlife"];

const distances = [
  { value: "walkable", label: "Walkable only" },
  { value: "short-drive", label: "Short drive" },
  { value: "anywhere", label: "Anywhere" },
];

const anchorModes = [
  { value: "auto", label: "Atlas decide" },
  { value: "user-location", label: "Near me" },
  { value: "zone", label: "Pick a zone" },
];

const zones = [
  "boardwalk",
  "broadway",
  "barefoot",
  "market-common",
  "downtown",
  "carolina-forest",
  "north-myrtle-beach",
  "myrtle-beach",
  "south-myrtle-beach",
];

const quickIdeas = [
  "Taco crawl with dessert",
  "Romantic rooftop night",
  "Family-friendly rainy day fun",
  "Arcade + burgers + drinks",
];

export default function HomePage() {
  const [input, setInput] = useState("");
  const [vibe, setVibe] = useState("fun");
  const [distance, setDistance] = useState("walkable");
  const [anchorMode, setAnchorMode] = useState("auto");
  const [selectedZone, setSelectedZone] = useState("boardwalk");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    try {
      setIsGettingLocation(true);
      setError("");

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      setUserLat(position.coords.latitude);
      setUserLng(position.coords.longitude);
    } catch {
      setError("Could not get your location.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError("");

      let finalLat = userLat;
      let finalLng = userLng;

      if (anchorMode === "user-location" && (finalLat == null || finalLng == null)) {
        if (!navigator.geolocation) {
          throw new Error("Location is not supported on this device.");
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        });

        finalLat = position.coords.latitude;
        finalLng = position.coords.longitude;
        setUserLat(finalLat);
        setUserLng(finalLng);
      }

      const res = await fetch("/api/atlas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          vibe,
          distance,
          anchorMode,
          selectedZone: anchorMode === "zone" ? selectedZone : null,
          userLat: anchorMode === "user-location" ? finalLat : null,
          userLng: anchorMode === "user-location" ? finalLng : null,
        }),
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
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            BeachLife Concierge
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
            Atlas 🌊
          </h1>
          <p className="mt-3 max-w-xl text-neutral-600">
            Build a fun local route for food, drinks, activities, and sweet stops.
          </p>
        </div>

        <Link
          href="/trips"
          className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          My Trips
        </Link>
      </div>

      <section className="rounded-[2rem] border bg-white p-6 shadow-sm">
        <label className="text-sm font-medium text-neutral-700">
          What kind of BeachLife experience do you want today?
        </label>

        <textarea
          className="mt-3 min-h-[160px] w-full rounded-[1.5rem] border p-4 text-base outline-none"
          placeholder="Tacos and rooftop drinks with a short walk..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-neutral-500">
              Mood
            </p>
            <div className="flex flex-wrap gap-2">
              {vibes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setVibe(item)}
                  className={`rounded-full border px-4 py-2 capitalize transition ${
                    vibe === item ? "bg-black text-white" : "bg-white hover:bg-neutral-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-neutral-500">
              Distance
            </p>
            <div className="flex flex-wrap gap-2">
              {distances.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDistance(item.value)}
                  className={`rounded-full border px-4 py-2 transition ${
                    distance === item.value ? "bg-black text-white" : "bg-white hover:bg-neutral-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-neutral-500">
              Start from
            </p>
            <div className="flex flex-wrap gap-2">
              {anchorModes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAnchorMode(item.value)}
                  className={`rounded-full border px-4 py-2 transition ${
                    anchorMode === item.value
                      ? "bg-black text-white"
                      : "bg-white hover:bg-neutral-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {anchorMode === "zone" ? (
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-neutral-500">
                Zone
              </p>
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`rounded-full border px-4 py-2 capitalize transition ${
                      selectedZone === zone
                        ? "bg-black text-white"
                        : "bg-white hover:bg-neutral-50"
                    }`}
                  >
                    {zone.replace(/-/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {anchorMode === "user-location" ? (
            <div className="rounded-2xl border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={isGettingLocation}
                  className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                >
                  {isGettingLocation
                    ? "Getting location..."
                    : userLat != null && userLng != null
                    ? "Location ready"
                    : "Use my location"}
                </button>

                {userLat != null && userLng != null ? (
                  <span className="text-sm text-neutral-600">
                    {userLat.toFixed(4)}, {userLng.toFixed(4)}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="mt-6 w-full rounded-full border px-6 py-4 text-base font-semibold transition hover:bg-neutral-50 disabled:opacity-50"
        >
          {isLoading ? "Building your BeachLife Experience..." : "Build My BeachLife Experience"}
        </button>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>

      <section>
        <p className="mb-3 text-sm uppercase tracking-[0.25em] text-neutral-500">
          Quick ideas
        </p>
        <div className="flex flex-wrap gap-2">
          {quickIdeas.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setInput(idea)}
              className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
            >
              {idea}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}