"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"

function ProcessingContent({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [adviceId, setAdviceId] = useState<string | null>(null)
  
  const roleParam = searchParams.get("role")

  useEffect(() => {
    if (!sessionId) return

    let isRedirecting = false

    const fetchAdviceId = async () => {
      if (isRedirecting) return

      const rolesToCheck = roleParam 
        ? [roleParam === "creator"] 
        : [true, false]

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

    fetchAdviceId()

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

    const intervalId = setInterval(fetchAdviceId, 2000)

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [sessionId, router, roleParam])

  return (
    <div className="min-h-screen bg-[var(--paper)] paper-texture flex items-center justify-center px-4">
      <div className="journal-card rounded-lg p-8 max-w-md w-full page-shadow text-center">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <BookOpen className="h-6 w-6 text-[var(--accent-warm)]" />
          <span className="handwritten text-2xl text-[var(--ink)]">Bondly</span>
        </div>

        <h1 className="handwritten text-3xl text-[var(--ink)] mb-4">
          Creating your guidance...
        </h1>
        
        <p className="text-[var(--ink-light)] mb-6">
          We're thoughtfully preparing personalized insights for both of you. This usually takes about 10 seconds.
        </p>

        {adviceId ? (
          <Link href={`/advice/${adviceId}`}>
            <Button className="btn-warm py-4 px-8 handwritten text-lg">
              Read Your Guidance
            </Button>
          </Link>
        ) : (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-warm)]" />
          </div>
        )}

        <p className="text-xs text-[var(--ink-faded)] mt-6">
          You'll be redirected automatically when ready
        </p>
      </div>
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
      <div className="min-h-screen bg-[var(--paper)] paper-texture flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-warm)]" />
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--paper)] paper-texture flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-warm)]" />
      </div>
    }>
      <ProcessingContent sessionId={sessionId} />
    </Suspense>
  )
}
