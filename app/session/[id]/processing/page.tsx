"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Heart, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"

function ProcessingContent({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [adviceId, setAdviceId] = useState<string | null>(null)
  
  // Determine role from query param or default to trying both
  const roleParam = searchParams.get("role")

  useEffect(() => {
    if (!sessionId) return

    let isRedirecting = false

    // Try to get advice ID using the API (bypasses RLS issues)
    const fetchAdviceId = async () => {
      if (isRedirecting) return

      // If role is specified, only check that role
      const rolesToCheck = roleParam 
        ? [roleParam === "creator"] 
        : [true, false] // Check both if not specified

      for (const isCreator of rolesToCheck) {
        try {
          const response = await fetch(
            `/api/get-advice-id?sessionId=${sessionId}&isCreator=${isCreator}`
          )
          if (response.ok) {
            const data = await response.json()
            if (data.adviceId) {
              setAdviceId(data.adviceId)
              if (!isRedirecting) {
                isRedirecting = true
                router.push(`/advice/${data.adviceId}`)
              }
              return true
            }
          }
        } catch (error) {
          console.error("Error fetching advice:", error)
        }
      }
      return false
    }

    // Initial check
    fetchAdviceId()

    // Also listen to session status changes
    const supabase = createClient()
    const channel = supabase
      .channel(`processing-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        async (payload: any) => {
          if (payload.new?.status === "analyzed") {
            await fetchAdviceId()
          }
        }
      )
      .subscribe()

    // Poll every 2 seconds
    const intervalId = setInterval(fetchAdviceId, 2000)

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [sessionId, router, roleParam])

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-rose-200 bg-white/80 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-16 w-16 text-rose-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Analyzing Your Responses</CardTitle>
          <CardDescription>We're generating personalized advice for both of you...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-6">
          {adviceId ? (
            <Link href={`/advice/${adviceId}`}>
              <Button className="bg-green-500 hover:bg-green-600">
                View Your Advice
              </Button>
            </Link>
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionId, setSessionId] = useState<string>("")

  useEffect(() => {
    params.then((p) => setSessionId(p.id))
  }, [params])

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    }>
      <ProcessingContent sessionId={sessionId} />
    </Suspense>
  )
}
