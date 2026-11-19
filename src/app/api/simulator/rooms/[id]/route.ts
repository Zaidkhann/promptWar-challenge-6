import { NextRequest, NextResponse } from "next/server";
import { getRoomById, saveUserRoom, deleteUserRoom } from "@/lib/simulator/room-store";
import { RoomConfigurationSchema } from "@/lib/simulator/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "user_default";

  const room = getRoomById(userId, id);
  if (!room) {
    return NextResponse.json(
      { error: "ROOM_NOT_FOUND", message: "Room configuration not found or unauthorized." },
      { status: 404 }
    );
  }

  return NextResponse.json({ room });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await req.json();
    const userId = body.userId || "user_default";

    const existing = getRoomById(userId, id);
    if (!existing) {
      return NextResponse.json(
        { error: "ROOM_NOT_FOUND", message: "Room configuration not found or unauthorized." },
        { status: 404 }
      );
    }

    const validation = RoomConfigurationSchema.partial().safeParse(body.room);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "INVALID_ROOM_DATA",
          message: "Room configuration update failed validation.",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const updated = saveUserRoom(userId, { ...validation.data, id });
    return NextResponse.json({ success: true, room: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update room configuration.";
    return NextResponse.json({ error: "UPDATE_ROOM_FAILED", message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "user_default";

  const deleted = deleteUserRoom(userId, id);
  if (!deleted) {
    return NextResponse.json(
      { error: "ROOM_NOT_FOUND", message: "Room configuration not found or unauthorized." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, deletedRoomId: id });
}
