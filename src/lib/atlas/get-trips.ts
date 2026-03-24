import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TripListItem = {
  id: string;
  title: string;
  zone: string;
  vibe: string | null;
  created_at: string;
  is_favorite: boolean | null;
  status: string | null;
  share_slug: string | null;
  cover_image: string | null;
};

export async function getTrips() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, title, zone, vibe, created_at, is_favorite, status, share_slug, cover_image"
    )
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTrips error:", error);
    return [];
  }

  return (data ?? []) as TripListItem[];
}
