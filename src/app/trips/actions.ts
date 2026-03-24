"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteTrip(tripId: string) {
  const supabase = createSupabaseServerClient();

  await supabase.from("trip_nodes").delete().eq("trip_id", tripId);
  await supabase.from("trips").delete().eq("id", tripId);

  revalidatePath("/trips");
}

export { addCollaborator };

export { updateStopNotes, updateStopRating };

export async function toggleFavorite(tripId: string, current: boolean) {
  const supabase = createSupabaseServerClient();

  await supabase
    .from("trips")
    .update({ is_favorite: !current })
    .eq("id", tripId);

  revalidatePath("/trips");
}
