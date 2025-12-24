"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CopyButton } from "@/components/copy-button"
import { useEffect, useState } from "react"
import type { Session } from "@/lib/types"

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionId, setSessionId] = useState<string>("")
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<"waiting" | "processing" | "ready">("waiting")
  const [creatorAdviceId, setCreatorAdviceId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    params.then((p) => setSessionId(p.id))
  }, [params])

  useEffect(() => {
    if (!sessionId) return

    const supabase = createClient()
    let isRedirecting = false

    // Fetch the CREATOR's advice specifically (not based on current auth)
    // This is the key fix - we look up by is_creator=true, not by user_id
    const fetchCreatorAdvice = async () => {
      // Use a server-side API to get the creator's advice ID
      // This bypasses the RLS issue where auth might be overwritten
      try {
        const response = await fetch(`/api/get-advice-id?sessionId=${sessionId}&isCreator=true`)
        if (response.ok) {
          const data = await response.json()
          if (data.adviceId) {
            setCreatorAdviceId(data.adviceId)
            if (!isRedirecting) {
              isRedirecting = true
              router.push(`/advice/${data.adviceId}`)
            }
            return true
          }
        }
      } catch (error) {
        console.error("Error fetching creator advice:", error)
      }
      return false
    }

    // Fetch initial session and check status
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single()
      
      if (error || !data) {
        router.push("/")
        return
      }

      setSession(data)
      setIsLoading(false)

      // Update status based on session state
      if (data.status === "waiting_for_partner") {
        setStatus("waiting")
      } else if (data.status === "completed") {
        setStatus("processing")
      } else if (data.status === "analyzed") {
        setStatus("ready")
        await fetchCreatorAdvice()
      }
    }

    fetchSession()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`share-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        async (payload: any) => {
          const newStatus = payload.new?.status
          
          if (newStatus === "completed") {
            setStatus("processing")
          } else if (newStatus === "analyzed") {
            setStatus("ready")
            await fetchCreatorAdvice()
          }
        }
      )
      .subscribe()

    // Polling fallback - check every 2 seconds
    const pollInterval = setInterval(async () => {
      if (isRedirecting) {
        clearInterval(pollInterval)
        return
      }

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("status")
        .eq("id", sessionId)
        .single()

      if (!sessionData) return

      if (sessionData.status === "completed" && status !== "processing") {
        setStatus("processing")
      }

      if (sessionData.status === "analyzed") {
        setStatus("ready")
        const redirected = await fetchCreatorAdvice()
        if (redirected) {
          clearInterval(pollInterval)
        }
      }
    }, 2000)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [sessionId, router, status])

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
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
          {/* Share Link Section */}
          <div className="bg-rose-50 p-6 rounded-lg border border-rose-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Send this link to {session.partner_name}:
            </p>
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

          {/* Status Indicator */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Status</h3>
            
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status === "waiting" 
                    ? "bg-rose-500 text-white" 
                    : "bg-green-500 text-white"
                }`}>
                  {status === "waiting" ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${status === "waiting" ? "text-rose-600" : "text-green-600"}`}>
                    Waiting for {session.partner_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {status === "waiting" 
                      ? "They need to open the link and share their perspective"
                      : "Partner has submitted their response"
                    }
                  </p>
                </div>
                {status === "waiting" && (
                  <Loader2 className="h-5 w-5 animate-spin text-rose-400" />
                )}
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status === "processing"
                    ? "bg-blue-500 text-white"
                    : status === "ready"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                }`}>
                  {status === "ready" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : status === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm">2</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    status === "processing" 
                      ? "text-blue-600" 
                      : status === "ready"
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}>
                    Generating personalized advice
                  </p>
                  <p className="text-sm text-gray-500">
                    {status === "processing"
                      ? "Our AI is analyzing both perspectives..."
                      : status === "ready"
                        ? "Your personalized advice is ready!"
                        : "Will start after partner responds"
                    }
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status === "ready"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}>
                  {status === "ready" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-sm">3</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${status === "ready" ? "text-green-600" : "text-gray-400"}`}>
                    View your advice
                  </p>
                  <p className="text-sm text-gray-500">
                    {status === "ready"
                      ? creatorAdviceId ? "Click below to view" : "Redirecting you now..."
                      : "You'll be redirected automatically"
                    }
                  </p>
                </div>
                {status === "ready" && !creatorAdviceId && (
                  <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                )}
              </div>
            </div>
            
            {/* View Advice Button when ready */}
            {status === "ready" && creatorAdviceId && (
              <Link href={`/advice/${creatorAdviceId}`}>
                <Button className="w-full bg-green-500 hover:bg-green-600 mt-4">
                  View Your Personalized Advice
                </Button>
              </Link>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>💡 How it works:</strong> This page updates automatically. Once {session.partner_name} completes 
              their response, you'll be redirected to your personalized advice. Each of you receives different advice 
              tailored to your perspective.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
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
