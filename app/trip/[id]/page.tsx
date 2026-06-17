import { supabase } from "@/lib/supabase";
import TripPageClient from "@/components/TripPageClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripPage({ params }: PageProps) {
  const { id } = await params;

  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !trip) notFound();

  return <TripPageClient trip={trip} />;
}
