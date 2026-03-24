import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getTrips() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trips")
    .select("id, title, zone, vibe, created_at, is_favorite")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTrips error:", error);
    return [];
  }

  return data ?? [];
}
