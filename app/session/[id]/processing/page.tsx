"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Heart, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionId, setSessionId] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    params.then((p) => setSessionId(p.id))
  }, [params])

  useEffect(() => {
    if (!sessionId) return

    const supabase = createClient()

    // Check if advice already exists and redirect to user's unique advice
    supabase
      .from("advice")
      .select("id, user_id")
      .eq("session_id", sessionId)
      .then(async ({ data: advice }) => {
        if (advice && advice.length >= 2) {
          // Get current user to find their advice
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const userAdvice = advice.find(a => a.user_id === user.id)
            if (userAdvice) {
              router.push(`/advice/${userAdvice.id}`)
              return
            }
          }
        }
      })

    // Subscribe to realtime updates for advice creation
    let channel: any = null
    try {
      channel = supabase
        .channel(`advice-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "advice",
            filter: `session_id=eq.${sessionId}`,
          },
        async () => {
          // Check if both pieces of advice exist and redirect to user's advice
          const { data: advice } = await supabase
            .from("advice")
            .select("id, user_id")
            .eq("session_id", sessionId)

          if (advice && advice.length >= 2) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const userAdvice = advice.find(a => a.user_id === user.id)
              if (userAdvice) {
                router.push(`/advice/${userAdvice.id}`)
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          if (payload.new && payload.new.status === "analyzed") {
            // Get user's advice when session is analyzed
            const { data: advice } = await supabase
              .from("advice")
              .select("id, user_id")
              .eq("session_id", sessionId)
            
            const { data: { user } } = await supabase.auth.getUser()
            if (user && advice) {
              const userAdvice = advice.find(a => a.user_id === user.id)
              if (userAdvice) {
                router.push(`/advice/${userAdvice.id}`)
              }
            }
          }
        }
      )
      .subscribe()
    } catch (error) {
      // Realtime failed, will use polling fallback
    }

    // Fallback: poll every 2 seconds as backup
    const intervalId = setInterval(async () => {
      const { data: advice } = await supabase
        .from("advice")
        .select("id, user_id")
        .eq("session_id", sessionId)

      if (advice && advice.length >= 2) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const userAdvice = advice.find(a => a.user_id === user.id)
          if (userAdvice) {
            clearInterval(intervalId)
            router.push(`/advice/${userAdvice.id}`)
          }
        }
      }
    }, 2000)

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId)
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [sessionId, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center px-4">
      <Card className="max-w-md border-rose-200 bg-white/80 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-16 w-16 text-rose-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Analyzing Your Responses</CardTitle>
          <CardDescription>We're generating personalized advice for both of you...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </CardContent>
      </Card>
    </div>
  )
}
