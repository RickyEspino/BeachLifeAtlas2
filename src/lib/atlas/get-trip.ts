import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getTripWithNodes(tripId: string) {
  const supabase = createSupabaseServerClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, title, zone, vibe, distance, created_at, is_favorite, status, share_slug, cover_image")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    console.error("getTripWithNodes trip error:", tripError);
    return null;
  }

  const { data: nodes, error: nodesError } = await supabase
    .from("trip_nodes")
    .select("id, trip_id, place_id, name, role, description, lat, lng, points_reward, sort_order, user_rating, notes")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  if (nodesError) {
    console.error("getTripWithNodes nodes error:", nodesError);
    return null;
  }

  return {
    ...trip,
    nodes: nodes ?? [],
  };
}
