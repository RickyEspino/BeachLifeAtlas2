import { getTrips } from "@/lib/atlas/get-trips";
import TripCard from "@/components/trips/trip-card";

export default async function TripsPage() {
  const trips = await getTrips();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">My Trips 🧭</h1>

      {trips.length === 0 ? (
        <p className="opacity-70">No trips yet. Go build one 😏</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </main>
  );
}
