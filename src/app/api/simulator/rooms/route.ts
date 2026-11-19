import { NextRequest, NextResponse } from "next/server";
import { getUserRooms, saveUserRoom } from "@/lib/simulator/room-store";
import { RoomConfigurationSchema } from "@/lib/simulator/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "user_default";

  const rooms = getUserRooms(userId);
  return NextResponse.json({
    userId,
    rooms,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || "user_default";
    const roomData = body.room;

    if (!roomData) {
      return NextResponse.json(
        { error: "MISSING_ROOM_DATA", message: "Room configuration object is required." },
        { status: 400 }
      );
    }

    const validation = RoomConfigurationSchema.partial().safeParse(roomData);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "INVALID_ROOM_CONFIGURATION",
          message: "Room configuration failed validation.",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const saved = saveUserRoom(userId, validation.data);

    return NextResponse.json({
      success: true,
      room: saved,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save room configuration.";
    return NextResponse.json(
      { error: "SAVE_ROOM_FAILED", message },
      { status: 500 }
    );
  }
}
