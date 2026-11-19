import { NextResponse } from "next/server";
import { CURATED_COMMUTE_CORRIDORS } from "@/lib/commute/routing/curated-corridors";

export async function GET() {
  const corridors = Object.values(CURATED_COMMUTE_CORRIDORS).map((c) => ({
    id: c.id,
    name: c.name,
    summary: c.summary,
    origin: c.origin.name || "Origin",
    destination: c.destination.name || "Destination",
    distanceKm: c.distanceKm,
    durationMinutes: c.durationMinutes,
  }));

  return NextResponse.json({
    success: true,
    corridors,
  });
}
