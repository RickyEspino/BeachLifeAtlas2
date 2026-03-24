import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtlasExperience } from "@/types/atlas";

export async function getTripById(tripId: string): Promise<AtlasExperience | null> {
  const supabase = createSupabaseServerClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, title, zone")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return null;
  }

  const { data: nodes, error: nodesError } = await supabase
    .from("trip_nodes")
    .select("id, place_id, name, role, description, lat, lng, points_reward, sort_order")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  if (nodesError || !nodes) {
    return null;
  }

  return {
    title: trip.title,
    zone: trip.zone,
    nodes: nodes.map((node) => ({
      id: node.id,
      place_id: node.place_id ?? undefined,
      name: node.name,
      role: node.role,
      description: node.description ?? "",
      lat: node.lat,
      lng: node.lng,
      points_reward: node.points_reward ?? 0,
      sort_order: node.sort_order,
    })),
    edges: nodes.slice(0, -1).map((node, index) => ({
      from: node.id,
      to: nodes[index + 1].id,
      mode: "walk",
    })),
  };
}
