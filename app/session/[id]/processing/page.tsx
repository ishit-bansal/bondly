"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"

// Make logo in processing page clickable
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
    <div className="min-h-screen diary-bg paper-texture flex items-center justify-center px-4">
      <div className="journal-card rounded-xl p-10 max-w-lg w-full page-shadow text-center">
        {/* Header */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 hover:opacity-80 transition">
          <Image src="/logo.svg" alt="Bondly" width={40} height={40} className="float" />
          <span className="handwritten text-3xl text-[var(--ink)]">Bondly</span>
        </Link>

        <h1 className="handwritten text-4xl text-[var(--ink)] mb-5">
          Creating your guidance...
        </h1>
        
        <p className="text-lg text-[var(--ink-light)] mb-8 serif-body">
          We're thoughtfully preparing personalized insights for both of you. This usually takes about 10 seconds.
        </p>

        {adviceId ? (
          <Link href={`/advice/${adviceId}`}>
            <Button className="btn-warm py-5 px-10 handwritten text-xl rounded-xl">
              Read Your Guidance
            </Button>
          </Link>
        ) : (
          <div className="flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--accent-warm)]" />
          </div>
        )}

        <p className="text-sm text-[var(--ink-faded)] mt-8">
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
      <div className="min-h-screen diary-bg paper-texture flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-warm)]" />
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen diary-bg paper-texture flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-warm)]" />
      </div>
    }>
      <ProcessingContent sessionId={sessionId} />
    </Suspense>
  )
}
