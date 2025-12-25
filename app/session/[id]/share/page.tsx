"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, Loader2, Copy, Check, BookOpen, ArrowLeft, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { Session } from "@/lib/types"

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const [sessionId, setSessionId] = useState<string>("")
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<"waiting" | "processing" | "ready">("waiting")
  const [creatorAdviceId, setCreatorAdviceId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [encryptionKey, setEncryptionKey] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    params.then((p) => setSessionId(p.id))
    // Get encryption key from URL fragment
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const keyMatch = hash.match(/key=([^&]+)/)
      if (keyMatch) {
        setEncryptionKey(keyMatch[1])
      }
    }
  }, [params])

  useEffect(() => {
    if (!sessionId) return

    const supabase = createClient()
    let isRedirecting = false

    const fetchCreatorAdvice = async () => {
      if (isRedirecting) return

      try {
        const response = await fetch(`/api/get-advice-id?sessionId=${sessionId}&isCreator=true`)
        if (response.ok) {
          const data = await response.json()
          if (data.adviceId) {
            setCreatorAdviceId(data.adviceId)
            if (!isRedirecting) {
              isRedirecting = true
              // Include encryption key in advice URL
              const keyParam = encryptionKey ? `#key=${encryptionKey}` : ''
              router.push(`/advice/${data.adviceId}${keyParam}`)
            }
            return true
          }
        }
      } catch (error) {
        console.error("Error fetching creator advice:", error)
      }
      return false
    }

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
  }, [sessionId, router, status, encryptionKey])

  const copyLink = async () => {
    if (!session) return
    // Include encryption key in partner link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const shareUrl = `${baseUrl}/partner/${session.share_token}${encryptionKey ? `#key=${encryptionKey}` : ''}`
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-[var(--paper)] paper-texture flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-warm)]" />
      </div>
    )
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/partner/${session.share_token}${encryptionKey ? `#key=${encryptionKey}` : ''}`

  return (
    <div className="min-h-screen bg-[var(--paper)] paper-texture py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-[var(--ink-light)] hover:text-[var(--ink)] transition">
            <ArrowLeft className="h-4 w-4" />
            <span className="handwritten text-lg">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--accent-warm)]" />
            <span className="handwritten text-xl text-[var(--ink)]">Bondly</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="journal-card rounded-lg p-8 pl-12 page-shadow">
          <div className="text-center mb-8">
            <h1 className="handwritten text-4xl text-[var(--ink)] mb-2">
              Thanks, {session.creator_name} ♡
            </h1>
            <p className="text-[var(--ink-light)]">
              Now it's {session.partner_name}'s turn to share their perspective
            </p>
          </div>

          {/* Share Link */}
          <div className="bg-[var(--highlight)] p-6 rounded-lg border border-[var(--paper-lines)] mb-8">
            <p className="text-sm text-[var(--ink)] mb-3 handwritten text-lg">
              Send this link to {session.partner_name}:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-4 py-2 text-sm bg-[var(--paper)] border border-[var(--paper-lines)] rounded"
              />
              <Button
                onClick={copyLink}
                variant="outline"
                className="flex-shrink-0 border-[var(--accent-warm)] text-[var(--accent-warm)] hover:bg-[var(--accent-warm)] hover:text-white"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-[var(--ink-faded)]">
              <Lock className="h-3 w-3" />
              <span>Link includes encryption key - only those with the link can read</span>
            </div>
          </div>

          {/* Status Steps */}
          <div className="space-y-4">
            <h3 className="handwritten text-xl text-[var(--ink)]">Status</h3>
            
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status === "waiting" 
                  ? "bg-[var(--accent-warm)] text-white" 
                  : "bg-[var(--accent-sage)] text-white"
              }`}>
                {status === "waiting" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className={`handwritten text-lg ${status === "waiting" ? "text-[var(--accent-warm)]" : "text-[var(--accent-sage)]"}`}>
                  Waiting for {session.partner_name}
                </p>
                <p className="text-sm text-[var(--ink-faded)]">
                  {status === "waiting" 
                    ? "They need to open the link and share their side"
                    : "Partner has shared their perspective ✓"
                  }
                </p>
              </div>
              {status === "waiting" && (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-warm)]" />
              )}
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status === "processing"
                  ? "bg-[var(--accent-warm)] text-white"
                  : status === "ready"
                    ? "bg-[var(--accent-sage)] text-white"
                    : "bg-[var(--paper-lines)] text-[var(--ink-faded)]"
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
                <p className={`handwritten text-lg ${
                  status === "processing" 
                    ? "text-[var(--accent-warm)]" 
                    : status === "ready"
                      ? "text-[var(--accent-sage)]"
                      : "text-[var(--ink-faded)]"
                }`}>
                  Generating guidance
                </p>
                <p className="text-sm text-[var(--ink-faded)]">
                  {status === "processing"
                    ? "Creating personalized insights..."
                    : status === "ready"
                      ? "Your guidance is ready ✓"
                      : "Will begin when both have shared"
                  }
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status === "ready"
                  ? "bg-[var(--accent-sage)] text-white"
                  : "bg-[var(--paper-lines)] text-[var(--ink-faded)]"
              }`}>
                {status === "ready" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-sm">3</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`handwritten text-lg ${status === "ready" ? "text-[var(--accent-sage)]" : "text-[var(--ink-faded)]"}`}>
                  Read your guidance
                </p>
                <p className="text-sm text-[var(--ink-faded)]">
                  {status === "ready"
                    ? creatorAdviceId ? "Click below to read" : "Redirecting..."
                    : "You'll be redirected automatically"
                  }
                </p>
              </div>
              {status === "ready" && !creatorAdviceId && (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-sage)]" />
              )}
            </div>
          </div>

          {/* View Advice Button */}
          {status === "ready" && creatorAdviceId && (
            <Link href={`/advice/${creatorAdviceId}${encryptionKey ? `#key=${encryptionKey}` : ''}`}>
              <Button className="w-full btn-warm py-6 mt-6 handwritten text-xl">
                Read Your Guidance
              </Button>
            </Link>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-6 text-center text-sm text-[var(--ink-faded)]">
          <p>This page updates automatically. Keep it open or come back later.</p>
        </div>
      </div>
    </div>
  )
}
