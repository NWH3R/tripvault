import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import type { Trip } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TripCard({ trip }: { trip: Trip }) {
  const unlocked = new Date() >= new Date(trip.unlock_at);
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="font-black text-gray-900 text-lg leading-tight">
          {trip.name}
        </h2>
        <span
          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            unlocked
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {unlocked ? "🔓 Revealed" : "🔒 Locked"}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {unlocked ? "Unlocked" : "Unlocks"} {formatDate(trip.unlock_at)}
      </p>
      <div className="flex items-center gap-4">
        <Link
          href={`/trip/${trip.id}`}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
        >
          View trip →
        </Link>
      </div>
    </div>
  );
}

export default async function MyTripsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/my-trips");
  }

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const tripList = trips ?? [];

  return (
    <main className="min-h-screen bg-[#fff8f0] relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-orange-300 to-pink-400 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Home
          </Link>
          <SignOutButton />
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 mb-1">My Trips</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>

        {/* Create CTA */}
        <Link
          href="/create"
          className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold px-6 py-4 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 mb-8"
        >
          <span className="text-xl select-none">✨</span>
          <span>Create New Trip</span>
        </Link>

        {/* Trip list */}
        {tripList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-3 select-none">🗺️</div>
            <p className="font-semibold text-gray-600 mb-1">No trips yet</p>
            <p className="text-sm text-gray-400">
              Create your first vault above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tripList.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
