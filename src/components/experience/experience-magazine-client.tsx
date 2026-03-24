"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
});
import {
  ArrowRight,
  Clock3,
  Map,
  MapPinned,
  Navigation,
  Sparkles,
  Flame,
  Candy,
  Martini,
  Trophy,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";

type TripNode = {
  id: string;
  trip_id?: string;
  place_id?: string | null;
  name: string;
  role: string;
  description: string;
  lat: number;
  lng: number;
  points_reward?: number | null;
  sort_order?: number | null;
  user_rating?: number | null;
  notes?: string | null;
};

type TripData = {
  id: string;
  title: string;
  zone: string;
  vibe?: string | null;
  distance?: string | null;
  created_at?: string;
  is_favorite?: boolean | null;
  status?: string | null;
  share_slug?: string | null;
  cover_image?: string | null;
  nodes: TripNode[];
  user_lat?: number | null;
  user_lng?: number | null;
};

type AltStop = {
  id: string;
  name: string;
  note: string;
  vibe: string;
};

type StopViewModel = {
  id: string;
  order: number;
  role: "START" | "BUILD" | "HIGHLIGHT" | "SWEET STOP" | "FINALE";
  title: string;
  kicker: string;
  description: string;
  image: string;
  tags: string[];
  points: number;
  estimatedTime: string;
  category: string;
  alternatives: AltStop[];
  lat: number;
  lng: number;
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
];

const roleTheme: Record<StopViewModel["role"], string> = {
  START: "from-orange-100 via-pink-50 to-white",
  BUILD: "from-blue-100 via-cyan-50 to-white",
  HIGHLIGHT: "from-fuchsia-200 via-orange-100 to-yellow-50",
  "SWEET STOP": "from-rose-100 via-pink-50 to-white",
  FINALE: "from-purple-200 via-pink-100 to-orange-50",
};

const roleIcon: Record<StopViewModel["role"], React.ReactNode> = {
  START: <Flame className="h-4 w-4" />,
  BUILD: <Navigation className="h-4 w-4" />,
  HIGHLIGHT: <Sparkles className="h-4 w-4" />,
  "SWEET STOP": <Candy className="h-4 w-4" />,
  FINALE: <Martini className="h-4 w-4" />,
};

function normalizeRole(role: string, index: number): StopViewModel["role"] {
  const safe = role.toUpperCase();

  if (
    safe === "START" ||
    safe === "BUILD" ||
    safe === "HIGHLIGHT" ||
    safe === "SWEET STOP" ||
    safe === "FINALE"
  ) {
    return safe;
  }

  const fallbackOrder: StopViewModel["role"][] = [
    "START",
    "BUILD",
    "HIGHLIGHT",
    "SWEET STOP",
    "FINALE",
  ];

  return fallbackOrder[index] ?? "BUILD";
}

function inferCategory(name: string, description: string) {
  const text = `${name} ${description}`.toLowerCase();

  if (text.includes("taco")) return "Tacos";
  if (
    text.includes("ice cream") ||
    text.includes("dessert") ||
    text.includes("shake") ||
    text.includes("waffle") ||
    text.includes("sweet")
  ) {
    return "Dessert";
  }
  if (
    text.includes("bar") ||
    text.includes("cocktail") ||
    text.includes("rooftop") ||
    text.includes("drink")
  ) {
    return "Drinks";
  }
  if (
    text.includes("arcade") ||
    text.includes("golf") ||
    text.includes("aquarium") ||
    text.includes("bowling") ||
    text.includes("go-kart")
  ) {
    return "Activity";
  }

  return "Stop";
}

function buildKicker(role: StopViewModel["role"]) {
  switch (role) {
    case "START":
      return "🔥 HOT START";
    case "BUILD":
      return "⚔️ BUILD THE ENERGY";
    case "HIGHLIGHT":
      return "🌊 MAIN EVENT";
    case "SWEET STOP":
      return "🍦 SWEET DETOUR";
    case "FINALE":
      return "⚡ FINAL NOTE";
    default:
      return "✨ FEATURED STOP";
  }
}

function buildEstimatedTime(role: StopViewModel["role"]) {
  switch (role) {
    case "START":
      return "40 min";
    case "BUILD":
      return "55 min";
    case "HIGHLIGHT":
      return "60 min";
    case "SWEET STOP":
      return "30 min";
    case "FINALE":
      return "45 min";
    default:
      return "45 min";
  }
}

function buildTags(stop: TripNode, role: StopViewModel["role"], category: string) {
  const tags = [
    `${category === "Stop" ? "✨" : category === "Tacos" ? "🌮" : category === "Dessert" ? "🍨" : category === "Drinks" ? "🍹" : "🎯"} ${category}`,
    `${role === "START" ? "⚡ Loud Start" : role === "BUILD" ? "🔥 Momentum" : role === "HIGHLIGHT" ? "✨ Highlight" : role === "SWEET STOP" ? "💖 Cozy" : "🍹 Last Call"}`,
    `+${stop.points_reward ?? 0} pts`,
  ];

  return tags;
}

function buildAlternatives(current: TripNode, allNodes: TripNode[]): AltStop[] {
  const others = allNodes.filter((node) => node.id !== current.id).slice(0, 3);

  if (others.length > 0) {
    return others.map((node, index) => ({
      id: node.id,
      name: node.name,
      note:
        node.description?.slice(0, 90) ||
        "A nearby alternative that keeps the route energy intact.",
      vibe: ["🔥 Local Heat", "🎉 Party", "✨ Fresh Pick"][index] ?? "✨ Fresh Pick",
    }));
  }

  return [
    {
      id: `${current.id}-alt-1`,
      name: `Another ${current.name} vibe`,
      note: "A similar stop that keeps the route energy moving.",
      vibe: "✨ Fresh Pick",
    },
  ];
}

function EditorialStop({
  stop,
  variant,
  onSwap,
}: {
  stop: StopViewModel;
  variant: number;
  onSwap: (stopId: string, alternativeId: string) => void;
}) {
  const reversed = variant % 2 === 1;

  return (
    <section className="space-y-5">
      <div
        className={`grid gap-6 overflow-hidden rounded-[2rem] border bg-gradient-to-br ${roleTheme[stop.role]} p-4 shadow-sm lg:grid-cols-2 lg:p-6 ${
          reversed ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="relative min-h-[260px] overflow-hidden rounded-[1.75rem]"
        >
          <img
            src={stop.image}
            alt={stop.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/50 text-sm font-bold text-white backdrop-blur">
            {stop.order}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              {roleIcon[stop.role]}
              {stop.kicker}
            </div>
            <h3 className="text-2xl font-black sm:text-3xl">{stop.title}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-black">
                {stop.role}
              </span>
              <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-sm">
                {stop.category}
              </span>
              <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-sm">
                +{stop.points} BeachPoints
              </span>
            </div>

            <p className="mt-5 text-lg leading-8 text-neutral-800">
              {stop.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {stop.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/85 px-3 py-1 text-sm font-semibold text-neutral-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-neutral-700">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2">
              <Clock3 className="h-4 w-4" />
              {stop.estimatedTime}
            </div>
            <button className="rounded-full bg-black px-4 py-2 text-white transition hover:bg-neutral-800">
              Lock this stop
            </button>
            <button className="rounded-full border border-black/10 bg-white/80 px-4 py-2 transition hover:bg-white">
              Regenerate section
            </button>
          </div>
        </motion.div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-2xl font-black">🔥 MORE LIKE THIS</h4>
          <p className="text-sm text-neutral-500">
            Swap this stop without rebuilding the whole route
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {stop.alternatives.map((item) => (
            <div
              key={item.id}
              className="min-w-[280px] rounded-[1.75rem] bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-xs font-bold text-orange-500">{item.vibe}</p>
              <h5 className="mt-2 text-xl font-bold">{item.name}</h5>
              <p className="mt-3 text-sm text-neutral-600">{item.note}</p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => onSwap(stop.id, item.id)}
                  className="rounded-full bg-black px-4 py-2 text-sm text-white transition hover:bg-neutral-800"
                >
                  Swap this pick
                </button>
                <button className="rounded-full border border-black/10 px-4 py-2 text-sm transition hover:bg-neutral-50">
                  More like this
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ExperienceMagazineClient({ trip }: { trip: TripData }) {
  const [localTrip, setLocalTrip] = useState(trip);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    trip.nodes[0]?.id ?? null
  );

  const stops = useMemo<StopViewModel[]>(() => {
    return localTrip.nodes.map((node, index) => {
      const role = normalizeRole(node.role, index);
      const category = inferCategory(node.name, node.description ?? "");

      return {
        id: node.id,
        order: index + 1,
        role,
        title: node.name,
        kicker: buildKicker(role),
        description: node.description ?? "",
        image: localTrip.cover_image || fallbackImages[index % fallbackImages.length],
        tags: buildTags(node, role, category),
        points: node.points_reward ?? 0,
        estimatedTime: buildEstimatedTime(role),
        category,
        alternatives: buildAlternatives(node, localTrip.nodes),
        lat: node.lat,
        lng: node.lng,
      };
    });
  }, [localTrip]);

  const highlightedStop = useMemo(
    () => stops.find((stop) => stop.role === "HIGHLIGHT") ?? stops[0],
    [stops]
  );

  const totalPoints = useMemo(
    () => localTrip.nodes.reduce((sum, node) => sum + (node.points_reward ?? 0), 0),
    [localTrip.nodes]
  );

  const handleSwap = (stopId: string, alternativeId: string) => {
    setLocalTrip((current) => ({
      ...current,
      nodes: current.nodes.map((node) => {
        if (node.id !== stopId) return node;

        const sourceNode = current.nodes.find((n) => n.id === alternativeId);
        if (sourceNode) {
          return {
            ...node,
            name: sourceNode.name,
            description: sourceNode.description,
            lat: sourceNode.lat,
            lng: sourceNode.lng,
            points_reward: sourceNode.points_reward,
          };
        }

        return {
          ...node,
          description:
            "This stop was swapped inline to keep the editorial flow moving without rebuilding the whole experience.",
        };
      }),
    }));

    setSelectedStopId(stopId);
  };

  const bonusItems = [
    "🌊 Waterfront walk — BUZZ continues",
    "🐚 Night seashell hunt",
    "⚔️ King Crab event triggered",
    "🍹 Bonus drinks + music nearby",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-pink-50 to-yellow-50 text-neutral-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="relative h-[78vh] min-h-[620px] w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${localTrip.cover_image || highlightedStop?.image || fallbackImages[0]})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.18),transparent_22%)]" />

          <div className="relative mx-auto flex h-full max-w-7xl items-end px-6 pb-12">
            <div className="max-w-4xl text-white">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-1 text-sm font-bold shadow-lg">
                <Sparkles className="h-4 w-4" />
                ATLAS BUZZ MODE
              </div>

              <h1 className="text-5xl font-black leading-tight sm:text-6xl lg:text-7xl">
                {localTrip.title}
              </h1>

              <p className="mt-3 text-lg uppercase tracking-[0.35em] text-white/80">
                {localTrip.zone.toUpperCase()} • {(localTrip.vibe ?? "FUN").toUpperCase()} • BUZZ IS RISING ⚡
              </p>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/90">
                {highlightedStop
                  ? `Built around ${highlightedStop.title}, this BeachLife Experience turns your route into a full editorial-style night out instead of a plain list of stops.`
                  : "A BeachLife Experience built for energy, flavor, and memorable movement."}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4 text-base font-bold text-black shadow-xl transition hover:scale-[1.02]">
                  START THE EXPERIENCE
                </button>
                <button className="rounded-full border border-white/30 bg-white/10 px-6 py-4 text-white backdrop-blur transition hover:bg-white/20">
                  <MapPinned className="mr-2 inline h-4 w-4" />
                  VIEW MAP
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* META HEADER */}
      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-6">
        <div className="overflow-hidden rounded-[2rem] bg-white/90 shadow-2xl backdrop-blur">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
                Experience header
              </p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                {localTrip.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
                Zone: {localTrip.zone} · Vibe: {localTrip.vibe ?? "fun"} ·
                Distance: {localTrip.distance ?? "walkable"} · Status: {" "}
                {localTrip.status ?? "published"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.5rem] bg-orange-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Zone
                </p>
                <p className="mt-2 font-bold">{localTrip.zone}</p>
              </div>
              <div className="rounded-[1.5rem] bg-pink-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Vibe
                </p>
                <p className="mt-2 font-bold">{localTrip.vibe ?? "fun"}</p>
              </div>
              <div className="rounded-[1.5rem] bg-yellow-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Distance
                </p>
                <p className="mt-2 font-bold">{localTrip.distance ?? "walkable"}</p>
              </div>
              <div className="rounded-[1.5rem] bg-purple-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Duration
                </p>
                <p className="mt-2 flex items-center gap-2 font-bold">
                  <Clock3 className="h-4 w-4" />
                  {stops.length * 45} min
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-cyan-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Points
                </p>
                <p className="mt-2 flex items-center gap-2 font-bold">
                  <Trophy className="h-4 w-4" />
                  {totalPoints}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-neutral-100 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Featured
                </p>
                <p className="mt-2 flex items-center gap-2 font-bold">
                  <Star className="h-4 w-4" />
                  {highlightedStop?.title ?? localTrip.nodes[0]?.name ?? "Top stop"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STOPS */}
      <section className="mx-auto max-w-7xl space-y-14 px-6 py-14">
        {stops.map((stop, index) => (
          <div key={stop.id} onMouseEnter={() => setSelectedStopId(stop.id)}>
            <EditorialStop stop={stop} variant={index} onSwap={handleSwap} />
          </div>
        ))}
      </section>

      {/* BONUS */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-8 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_.9fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/70">
                Bonus layer / future promoted stop
              </p>
              <h3 className="mt-3 text-3xl font-black sm:text-4xl">
                ⚡ BUZZ CONTINUES AFTER DINNER
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/90">
                This is your optional bonus layer. Later it can become a promoted
                stop, a sponsored add-on, or a surprise reward extension that
                feels like value instead of an ad.
              </p>
              <button className="mt-6 rounded-full bg-white px-5 py-3 text-black transition hover:bg-white/90">
                Unlock bonus ideas
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </button>
            </div>

            <div className="rounded-[1.75rem] bg-white/12 p-5 backdrop-blur">
              <ul className="space-y-3">
                {bonusItems.map((item) => (
                  <li key={item} className="text-lg font-semibold">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MAP */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
              Final route layer
            </p>
            <h3 className="mt-2 text-3xl font-black">
              Map with user location + numbered pins
            </h3>
          </div>
          <button className="rounded-full border border-black/10 bg-white px-5 py-3 transition hover:bg-neutral-50">
            <Map className="mr-2 inline h-4 w-4" />
            Expand route
          </button>
        </div>

        {localTrip.nodes.length > 0 ? (
          <div className="overflow-hidden rounded-[2rem] border bg-white p-4 shadow-sm">
            <MapView
              nodes={localTrip.nodes.map((node) => ({
                id: node.id,
                place_id: node.place_id ?? undefined,
                name: node.name,
                role: node.role,
                description: node.description ?? "",
                lat: node.lat,
                lng: node.lng,
                points_reward: node.points_reward ?? 0,
                sort_order: node.sort_order ?? 0,
              }))}
              userLocation={
                typeof (localTrip as { user_lat?: number | null }).user_lat === "number" &&
                typeof (localTrip as { user_lng?: number | null }).user_lng === "number"
                  ? {
                      lat: (localTrip as { user_lat: number }).user_lat,
                      lng: (localTrip as { user_lng: number }).user_lng,
                    }
                  : null
              }
              selectedStopId={selectedStopId}
              heightClassName="h-[560px]"
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
