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
    let intervalId: NodeJS.Timeout | null = null

    // Poll for session status
    intervalId = setInterval(async () => {
      const { data } = await supabase.from("sessions").select("status").eq("id", sessionId).single()

      if (data?.status === "analyzed") {
        if (intervalId) clearInterval(intervalId)
        router.push(`/session/${sessionId}/advice`)
      }
    }, 3000)

    // Cleanup on unmount
    return () => {
      if (intervalId) clearInterval(intervalId)
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
