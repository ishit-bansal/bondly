import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * GET /api/get-advice-id?sessionId=xxx&isCreator=true|false
 * 
 * This endpoint returns the advice ID for a given session and role.
 * It uses the admin client to bypass RLS, which is necessary because:
 * 1. When both users share the same browser, auth sessions can be overwritten
 * 2. The share page knows the user is the creator, so we can safely return creator's advice
 * 3. The partner page knows the user is the partner, so we can safely return partner's advice
 * 
 * Security: We only return the advice ID, not the advice content.
 * The actual advice page still requires proper authentication.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const isCreator = searchParams.get("isCreator") === "true"

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    if (!isValidUUID(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const supabase = await createClient(true)

    // Get advice by session ID and role
    const { data: advice, error } = await supabase
      .from("advice")
      .select("id")
      .eq("session_id", sessionId)
      .eq("is_creator", isCreator)
      .single()

    if (error || !advice) {
      return NextResponse.json({ adviceId: null }, { status: 200 })
    }

    return NextResponse.json({ adviceId: advice.id })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

