import "server-only";
import { CalculatedRoute } from "../types";
import { geocodeLocation } from "./geocoding";
import { CURATED_COMMUTE_CORRIDORS } from "./curated-corridors";
import { calculateOSRMRoute } from "./osrm-provider";
import { calculateHaversineDistanceKm } from "@/lib/aqi/providers/cpcb";

export interface RouteResolutionResult {
  route: CalculatedRoute;
  originFormatted: string;
  destinationFormatted: string;
  source: "Curated_Corridor" | "OSRM_Live" | "Synthesized_Assumption";
  warnings: string[];
}

/**
 * Resolves a commute route between two textual locations or coordinates.
 * Priority:
 * 1. Curated real-road metropolitan corridors (0ms latency, verified road curves).
 * 2. OSRM live road network engine.
 * 3. Graceful waypoint synthesis (fallback when offline).
 */
export async function resolveCommuteRoute(
  originQuery: string,
  destinationQuery: string,
  profile: "driving" | "walking" | "cycling" = "driving"
): Promise<RouteResolutionResult> {
  const warnings: string[] = [];

  const normOrigin = originQuery.toLowerCase();
  const normDest = destinationQuery.toLowerCase();

  // 1. Check curated corridor match
  for (const [key, corridor] of Object.entries(CURATED_COMMUTE_CORRIDORS)) {
    const originMatched =
      corridor.origin.name?.toLowerCase().includes(normOrigin) ||
      normOrigin.includes(corridor.origin.name?.toLowerCase() || "") ||
      normOrigin.includes(key.split("_")[1] || "");

    const destMatched =
      corridor.destination.name?.toLowerCase().includes(normDest) ||
      normDest.includes(corridor.destination.name?.toLowerCase() || "") ||
      normDest.includes(key.split("_")[key.split("_").length - 1] || "");

    if (originMatched && destMatched) {
      return {
        route: {
          ...corridor,
          mode: profile,
          // Scale duration for active travel modes
          durationMinutes:
            profile === "walking"
              ? Math.round(corridor.distanceKm * (60 / 4.8))
              : profile === "cycling"
              ? Math.round(corridor.distanceKm * (60 / 14))
              : corridor.durationMinutes,
        },
        originFormatted: corridor.origin.name || originQuery,
        destinationFormatted: corridor.destination.name || destinationQuery,
        source: "Curated_Corridor",
        warnings: [],
      };
    }
  }

  // 2. Geocode origin and destination concurrently
  const [originGeo, destGeo] = await Promise.all([
    geocodeLocation(originQuery),
    geocodeLocation(destinationQuery),
  ]);

  if (!originGeo || !destGeo) {
    // Fallback to default Delhi Anand Vihar -> CP corridor if completely unrecognizable
    warnings.push(
      `Could not recognize "${!originGeo ? originQuery : destinationQuery}". Falling back to Delhi Anand Vihar – Connaught Place arterial baseline.`
    );
    const fallbackCorridor = CURATED_COMMUTE_CORRIDORS["delhi_anand_vihar_to_cp"];
    return {
      route: fallbackCorridor,
      originFormatted: fallbackCorridor.origin.name || "Anand Vihar, Delhi",
      destinationFormatted: fallbackCorridor.destination.name || "Connaught Place, New Delhi",
      source: "Curated_Corridor",
      warnings,
    };
  }

  // 3. Query OSRM routing engine
  const osrmRoute = await calculateOSRMRoute(originGeo.point, destGeo.point, profile);
  if (osrmRoute && osrmRoute.geometry.length > 1) {
    return {
      route: osrmRoute,
      originFormatted: originGeo.formattedAddress,
      destinationFormatted: destGeo.formattedAddress,
      source: "OSRM_Live",
      warnings: [],
    };
  }

  // 4. Graceful offline synthesis (Interpolated road waypoints)
  warnings.push("Live routing provider unreachable. Synthesized road waypoints used as baseline.");
  const distKm = calculateHaversineDistanceKm(
    originGeo.point.lat,
    originGeo.point.lon,
    destGeo.point.lat,
    destGeo.point.lon
  );

  // Road circuitousness factor (typical Indian city road factor ~1.30x straight line)
  const actualRoadDistKm = Number((distKm * 1.32).toFixed(2));
  const avgSpeedKmH = profile === "walking" ? 4.8 : profile === "cycling" ? 14 : 26;
  const durationMins = Math.max(2, Math.round((actualRoadDistKm / avgSpeedKmH) * 60));

  // Generate intermediate points along arc
  const stepsCount = Math.max(5, Math.min(12, Math.round(actualRoadDistKm)));
  const geometry: Array<[number, number]> = [];

  for (let i = 0; i <= stepsCount; i++) {
    const frac = i / stepsCount;
    // Introduce slight road curvature
    const midCurveLat = Math.sin(frac * Math.PI) * 0.008;
    const lat = originGeo.point.lat + frac * (destGeo.point.lat - originGeo.point.lat) + midCurveLat;
    const lon = originGeo.point.lon + frac * (destGeo.point.lon - originGeo.point.lon);
    geometry.push([Number(lat.toFixed(6)), Number(lon.toFixed(6))]);
  }

  const synthesizedRoute: CalculatedRoute = {
    id: `synth_${Date.now()}`,
    name: `${originGeo.point.name || "Origin"} to ${destGeo.point.name || "Destination"}`,
    summary: `Direct Arterial Corridor (${actualRoadDistKm} km)`,
    origin: originGeo.point,
    destination: destGeo.point,
    distanceKm: actualRoadDistKm,
    durationMinutes: durationMins,
    mode: profile,
    geometry,
    segments: [
      {
        index: 0,
        start: originGeo.point,
        end: destGeo.point,
        distanceMeters: Math.round(actualRoadDistKm * 1000),
        durationSeconds: durationMins * 60,
        roadName: "Arterial Road Network",
        instruction: "Proceed along city road network to destination.",
      },
    ],
    provider: "User_Assumption",
    isEstimated: true,
    trafficAware: false,
  };

  return {
    route: synthesizedRoute,
    originFormatted: originGeo.formattedAddress,
    destinationFormatted: destGeo.formattedAddress,
    source: "Synthesized_Assumption",
    warnings,
  };
}
