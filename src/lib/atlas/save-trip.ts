import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtlasExperience } from "@/types/atlas";

interface SaveTripParams {
  experience: AtlasExperience;
  userInput?: string;
  vibe?: string;
  distance?: string;
  anchorMode?: string;
  selectedZone?: string | null;
  userLat?: number | null;
  userLng?: number | null;
}

export async function saveTrip({
  experience,
  userInput,
  vibe,
  distance,
  anchorMode,
  selectedZone,
  userLat,
  userLng,
}: SaveTripParams) {
  const supabase = createSupabaseServerClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      title: experience.title,
      zone: experience.zone,
      user_input: userInput ?? null,
      vibe: vibe ?? null,
      distance: distance ?? null,
      anchor_mode: anchorMode ?? null,
      selected_zone: selectedZone ?? null,
      user_lat: userLat ?? null,
      user_lng: userLng ?? null,
    })
    .select("id")
    .single();

  if (tripError || !trip) {
    throw new Error(tripError?.message || "Failed to create trip");
  }

  const nodes = experience.nodes.map((node, index) => ({
    trip_id: trip.id,
    place_id: node.place_id ?? node.id ?? null,
    name: node.name,
    role: node.role,
    description: node.description,
    lat: node.lat,
    lng: node.lng,
    points_reward: node.points_reward ?? 0,
    sort_order: index,
  }));

  const { error: nodesError } = await supabase.from("trip_nodes").insert(nodes);

  if (nodesError) {
    throw new Error(nodesError.message || "Failed to save trip nodes");
  }

  return trip.id as string;
}