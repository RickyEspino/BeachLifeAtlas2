import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtlasNode } from "@/types/atlas";

interface SaveQuickSearchParams {
  query?: string;
  vibe?: string;
  distance?: string;
  anchorMode?: string;
  selectedZone?: string | null;
  userLat?: number | null;
  userLng?: number | null;
  results: AtlasNode[];
}

export async function saveQuickSearch({
  query,
  vibe,
  distance,
  anchorMode,
  selectedZone,
  userLat,
  userLng,
  results,
}: SaveQuickSearchParams) {
  const supabase = createSupabaseServerClient();

  const { data: search, error: searchError } = await supabase
    .from("quick_searches")
    .insert({
      query: query ?? null,
      vibe: vibe ?? null,
      distance: distance ?? null,
      anchor_mode: anchorMode ?? null,
      selected_zone: selectedZone ?? null,
      user_lat: userLat ?? null,
      user_lng: userLng ?? null,
    })
    .select("id")
    .single();

  if (searchError || !search) {
    throw new Error(searchError?.message || "Failed to create quick search");
  }

  const rows = results.map((node, index) => ({
    search_id: search.id,
    place_id: node.place_id ?? node.id ?? null,
    name: node.name,
    category: (node as { category?: string }).category ?? null,
    description: node.description,
    lat: node.lat,
    lng: node.lng,
    points_reward: node.points_reward ?? 0,
    sort_order: index,
  }));

  const { error: resultsError } = await supabase
    .from("quick_search_results")
    .insert(rows);

  if (resultsError) {
    throw new Error(resultsError.message || "Failed to save quick results");
  }

  return search.id as string;
}
