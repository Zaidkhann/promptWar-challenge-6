import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveCommuteRoute } from "@/lib/commute/routing/service";
import { sampleRouteSpatialExposureAsync } from "@/lib/commute/spatial-exposure";
import { compareCommuteAlternatives } from "@/lib/commute/comparator";
import { generateCommuteActionAdvisories } from "@/lib/commute/recommendations";
import { MaskTypeEnum, OptimizationObjectiveEnum } from "@/lib/commute/types";

const CommuteExposureRequestSchema = z.object({
  origin: z.string().min(2).max(200),
  destination: z.string().min(2).max(200),
  departureHour: z.number().int().min(0).max(23).default(8),
  maskType: MaskTypeEnum.default("NONE"),
  objective: OptimizationObjectiveEnum.default("lowest_exposure"),
  ambientPM25: z.number().positive().max(2000).default(388),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CommuteExposureRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid commute exposure parameters",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { origin, destination, departureHour, maskType, objective, ambientPM25 } = parsed.data;

    // 1. Resolve route
    const resolved = await resolveCommuteRoute(origin, destination);

    // 2. Spatial IDW sampling with real OpenAQ v3 integration
    const spatialProfile = await sampleRouteSpatialExposureAsync(resolved.route, ambientPM25, departureHour);

    // 3. Compare all modal alternatives
    const matrix = compareCommuteAlternatives({
      route: resolved.route,
      spatialProfile,
      departureHour,
      maskType,
      objective,
    });

    // 4. Action Advisories
    const advisories = generateCommuteActionAdvisories(matrix);

    return NextResponse.json({
      success: true,
      data: {
        matrix,
        advisories,
        originFormatted: resolved.originFormatted,
        destinationFormatted: resolved.destinationFormatted,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Commute exposure analysis failed";
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
