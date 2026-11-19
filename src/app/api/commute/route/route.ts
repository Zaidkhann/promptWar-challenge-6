import { NextRequest, NextResponse } from "next/server";
import { RouteCalculationRequestSchema } from "@/lib/commute/types";
import { resolveCommuteRoute } from "@/lib/commute/routing/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RouteCalculationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid route request parameters",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { origin, destination, preferredMode } = parsed.data;

    let profile: "driving" | "walking" | "cycling" = "driving";
    if (preferredMode === "walking") profile = "walking";
    else if (preferredMode === "cycling") profile = "cycling";

    const resolved = await resolveCommuteRoute(origin, destination, profile);

    return NextResponse.json({
      success: true,
      data: {
        route: resolved.route,
        originFormatted: resolved.originFormatted,
        destinationFormatted: resolved.destinationFormatted,
        source: resolved.source,
        warnings: resolved.warnings,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Route resolution failed";
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
