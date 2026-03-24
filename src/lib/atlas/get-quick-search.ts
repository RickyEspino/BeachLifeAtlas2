import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getQuickSearchById(searchId: string) {
  const supabase = createSupabaseServerClient();

  const { data: search, error: searchError } = await supabase
    .from("quick_searches")
    .select("id, query, vibe, distance, anchor_mode, selected_zone, created_at")
    .eq("id", searchId)
    .single();

  if (searchError || !search) {
    return null;
  }

  const { data: results, error: resultsError } = await supabase
    .from("quick_search_results")
    .select("id, place_id, name, category, description, lat, lng, points_reward, sort_order")
    .eq("search_id", searchId)
    .order("sort_order", { ascending: true });

  if (resultsError) {
    return null;
  }

  return {
    ...search,
    results: results ?? [],
  };
}
