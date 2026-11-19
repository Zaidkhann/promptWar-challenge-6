import { NextRequest, NextResponse } from "next/server";
import { listUserConversations, createConversation } from "@/lib/agent/conversation-store";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") || "default_user";
  const conversations = listUserConversations(userId);

  return NextResponse.json({ conversations }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || "default_user";
    const title = body.title || "New Inquiry";

    const conversation = createConversation(userId, title);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create conversation";
    return NextResponse.json(
      { error: "FAILED_TO_CREATE_CONVERSATION", message },
      { status: 500 }
    );
  }
}
