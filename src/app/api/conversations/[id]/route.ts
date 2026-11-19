import { NextRequest, NextResponse } from "next/server";
import { getConversation, deleteConversation, clearConversationMessages } from "@/lib/agent/conversation-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.nextUrl.searchParams.get("userId") || "default_user";

  const conversation = getConversation(id, userId);
  if (!conversation) {
    return NextResponse.json(
      { error: "CONVERSATION_NOT_FOUND", message: "Conversation does not exist or unauthorized." },
      { status: 404 }
    );
  }

  return NextResponse.json({ conversation }, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.nextUrl.searchParams.get("userId") || "default_user";

  const deleted = deleteConversation(id, userId);
  if (!deleted) {
    return NextResponse.json(
      { error: "CONVERSATION_NOT_FOUND", message: "Conversation not found or unauthorized." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, message: "Conversation deleted." }, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.nextUrl.searchParams.get("userId") || "default_user";

  const cleared = clearConversationMessages(id, userId);
  if (!cleared) {
    return NextResponse.json(
      { error: "CONVERSATION_NOT_FOUND", message: "Conversation not found or unauthorized." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, message: "Messages cleared." }, { status: 200 });
}
