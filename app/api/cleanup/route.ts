import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

/**
 * GET /api/cleanup
 * 
 * Deletes all data older than 24 hours.
 * This endpoint is called by Vercel Cron every hour.
 * 
 * Security: Uses CRON_SECRET to prevent unauthorized access
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // In development, allow without secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const supabase = await createClient(true) // Use admin client

    // Delete advice older than 24 hours
    const { count: deletedAdvice } = await supabase
      .from("advice")
      .delete()
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select("*", { count: "exact", head: true })

    // Delete responses older than 24 hours
    const { count: deletedResponses } = await supabase
      .from("responses")
      .delete()
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select("*", { count: "exact", head: true })

    // Delete sessions older than 24 hours
    const { count: deletedSessions } = await supabase
      .from("sessions")
      .delete()
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      success: true,
      deleted: {
        sessions: deletedSessions || 0,
        responses: deletedResponses || 0,
        advice: deletedAdvice || 0,
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ 
      error: "Cleanup failed",
      message: error.message 
    }, { status: 500 })
  }
}

