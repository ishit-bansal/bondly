"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CopyButton } from "@/components/copy-button"
import { useEffect, useState } from "react"
import type { Session } from "@/lib/types"

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionId, setSessionId] = useState<string>("")
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    params.then((p) => setSessionId(p.id))
  }, [params])

  useEffect(() => {
    if (!sessionId) return

    const supabase = createClient()

    // Fetch initial session
    const fetchSession = async () => {
      const { data, error } = await supabase.from("sessions").select("*").eq("id", sessionId).single()
      
      if (error || !data) {
        router.push("/")
        return
      }

      setSession(data)
      setIsLoading(false)

      // If already analyzed, redirect to creator's advice
      if (data.status === "analyzed") {
        const { data: advice } = await supabase
          .from("advice")
          .select("id, user_id")
          .eq("session_id", sessionId)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (user && advice) {
          const userAdvice = advice.find(a => a.user_id === user.id)
          if (userAdvice) {
            router.push(`/advice/${userAdvice.id}`)
            return
          }
        }
      }

      // If completed, redirect to processing
      if (data.status === "completed") {
        router.push(`/session/${sessionId}/processing`)
        return
      }
    }

    fetchSession()

    // Subscribe to realtime updates for session status and advice
    let channel: any = null
    try {
      channel = supabase
        .channel(`session-${sessionId}`)
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
            // Get creator's advice when session is analyzed
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
          } else if (payload.new && payload.new.status === "completed") {
            router.push(`/session/${sessionId}/processing`)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "advice",
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // Check if both pieces of advice exist and redirect to creator's advice
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
      .subscribe()
    } catch (error) {
      // Realtime failed, will use polling fallback
    }

    // Fallback: poll every 3 seconds if realtime isn't working
    const pollInterval = setInterval(async () => {
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("status")
        .eq("id", sessionId)
        .single()

      if (sessionData) {
        if (sessionData.status === "analyzed") {
          clearInterval(pollInterval)
          router.push(`/session/${sessionId}/advice`)
        } else if (sessionData.status === "completed") {
          router.push(`/session/${sessionId}/processing`)
        }
      }

      // Also check for advice and redirect to user's unique advice
      const { data: advice } = await supabase
        .from("advice")
        .select("id, user_id")
        .eq("session_id", sessionId)

      if (advice && advice.length >= 2) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const userAdvice = advice.find(a => a.user_id === user.id)
          if (userAdvice) {
            clearInterval(pollInterval)
            router.push(`/advice/${userAdvice.id}`)
          }
        }
      }
    }, 3000)

    return () => {
      clearInterval(pollInterval)
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [sessionId, router])

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/partner/${session.share_token}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full border-rose-200 bg-white/80 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-16 w-16 text-rose-500" />
          </div>
          <CardTitle className="text-3xl">Thanks for sharing, {session.creator_name}!</CardTitle>
          <CardDescription className="text-base mt-2">
            Now it's time for {session.partner_name} to share their perspective
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-rose-50 p-6 rounded-lg border border-rose-200">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Share this link with your partner:</Label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm"
              />
              <CopyButton text={shareUrl} />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>What happens next?</strong> Once {session.partner_name} completes their response, we'll generate
              personalized advice for both of you. You'll each receive feedback tailored to your perspective.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href={`/session/${sessionId}/processing`}>
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                Check Status
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full bg-transparent">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
