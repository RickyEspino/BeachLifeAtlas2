import { getTripWithNodes } from "@/lib/atlas/get-trip";
import { notFound } from "next/navigation";
import ExperienceMagazineClient from "@/components/experience/experience-magazine-client";

interface ExperiencePageProps {
  params: Promise<{ tripId: string }>;
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { tripId } = await params;
  const trip = await getTripWithNodes(tripId);

  if (!trip) {
    notFound();
  }

  return <ExperienceMagazineClient trip={trip} />;
}