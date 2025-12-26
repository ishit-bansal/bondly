"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { encryptText } from "@/lib/encryption"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Loader2 } from "lucide-react"
import Image from "next/image"
import type { Session } from "@/lib/types"

const emotions = [
  "Frustrated",
  "Sad",
  "Angry",
  "Hurt",
  "Confused",
  "Anxious",
  "Hopeful",
  "Grateful",
  "Disappointed",
  "Overwhelmed",
]

export default function PartnerResponsePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("")
  const [session, setSession] = useState<Session | null>(null)
  const [situation, setSituation] = useState("")
  const [feelings, setFeelings] = useState("")
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [encryptionKey, setEncryptionKey] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    params.then((p) => setToken(p.token))
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
    if (!token) return

    // Validate token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(token)) {
      setError("This link doesn't look right. Please ask your partner for a new one.")
      setIsLoading(false)
      return
    }

    const fetchSession = async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("share_token", token)
        .single()

      if (error || !data) {
        setError("This session wasn't found or the link has expired. Sessions are automatically deleted after 24 hours for your privacy.")
        setIsLoading(false)
        return
      }

      if (data.status === "analyzed") {
        setError("This conversation has already been completed. Both partners have received their guidance.")
        setIsLoading(false)
        return
      }

      if (data.status === "completed") {
        setError("You've already shared your perspective. We're generating guidance now...")
        setIsLoading(false)
        return
      }

      setSession(data)
      setIsLoading(false)
    }

    fetchSession()
  }, [token])

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) => 
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create anonymous user for partner
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create session")

      // Encrypt data if we have the encryption key
      let situationData = situation
      let feelingsData = feelings
      let emotionsData = selectedEmotions

      if (encryptionKey) {
        situationData = await encryptText(situation, encryptionKey)
        feelingsData = await encryptText(feelings, encryptionKey)
        emotionsData = [await encryptText(JSON.stringify(selectedEmotions), encryptionKey)]
      }

      // Create partner's response
      const { error: responseError } = await supabase
        .from("responses")
        .insert({
          session_id: session.id,
          user_id: authData.user.id,
          is_creator: false,
          situation_description: situationData,
          feelings: feelingsData,
          emotional_state: emotionsData,
        })

      if (responseError) throw responseError

      // Small delay for DB consistency
      await new Promise(resolve => setTimeout(resolve, 300))

      // Update session status
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ status: "completed" })
        .eq("id", session.id)

      if (updateError) throw updateError
      
      // Trigger AI analysis
      const response = await fetch("/api/analyze-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: session.id,
          encryptionKey: encryptionKey || undefined
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (responseData.code === "QUOTA_EXCEEDED" || response.status === 429) {
          setError("We're processing a lot of requests right now. Your response has been saved. Check back soon for your guidance.")
          setTimeout(() => {
            router.push(`/session/${session.id}/processing`)
          }, 3000)
          return
        }
        throw new Error(responseData.error || "Failed to generate guidance")
      }

      // Redirect to partner's unique advice page
      if (responseData.adviceIds?.partner) {
        const keyParam = encryptionKey ? `#key=${encryptionKey}` : ''
        router.push(`/advice/${responseData.adviceIds.partner}${keyParam}`)
        return
      }
      
      router.push(`/session/${session.id}/processing`)
    } catch (err) {
      console.error("Error submitting response:", err)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen diary-bg paper-texture flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-warm)]" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen diary-bg paper-texture flex items-center justify-center px-4">
        <div className="journal-card rounded-xl p-10 max-w-md page-shadow">
          <h2 className="handwritten text-3xl text-[var(--ink)] mb-4">Hmm...</h2>
          <p className="text-lg text-[var(--ink-light)] serif-body">{error || "Something went wrong"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen diary-bg diary-margin paper-texture py-12 px-4">
      <div className="container mx-auto max-w-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Bondly" width={40} height={40} />
            <span className="handwritten text-3xl text-[var(--ink)]">Bondly</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="journal-card rounded-xl p-10 pl-14 page-shadow">
          <div className="mb-8">
            <h1 className="handwritten text-5xl text-[var(--ink)] mb-3">
              Hi {session.partner_name} ♡
            </h1>
            <p className="text-lg text-[var(--ink-light)] serif-body">
              {session.creator_name} wants to understand things better. Share your side of the story.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Situation */}
            <div className="space-y-2">
              <Label htmlFor="situation" className="text-[var(--ink)]">
                What's your perspective on this?
              </Label>
              <Textarea
                id="situation"
                placeholder="Share your side of the story..."
                value={situation}
                onChange={(e) => setSituation(e.target.value.slice(0, 2000))}
                required
                rows={6}
                className="resize-none handwritten text-lg leading-relaxed"
                maxLength={2000}
              />
              <p className="text-xs text-[var(--ink-faded)] text-right">{situation.length}/2000</p>
            </div>

            {/* Feelings */}
            <div className="space-y-2">
              <Label htmlFor="feelings" className="text-[var(--ink)]">
                How are you feeling about this?
              </Label>
              <Textarea
                id="feelings"
                placeholder="Express your emotions honestly..."
                value={feelings}
                onChange={(e) => setFeelings(e.target.value.slice(0, 1000))}
                required
                rows={4}
                className="resize-none handwritten text-lg leading-relaxed"
                maxLength={1000}
              />
              <p className="text-xs text-[var(--ink-faded)] text-right">{feelings.length}/1000</p>
            </div>

            {/* Emotions */}
            <div className="space-y-3">
              <Label className="text-[var(--ink)]">I'm feeling... (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {emotions.map((emotion) => (
                  <div key={emotion} className="flex items-center gap-2">
                    <Checkbox
                      id={emotion}
                      checked={selectedEmotions.includes(emotion)}
                      onCheckedChange={() => toggleEmotion(emotion)}
                    />
                    <Label htmlFor={emotion} className="cursor-pointer font-normal text-[var(--ink-light)] handwritten text-lg">
                      {emotion}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--destructive)] bg-red-50 p-3 rounded">
                {error}
              </p>
            )}

            {/* Privacy Note */}
            <div className="flex items-start gap-3 p-4 bg-[var(--highlight)] rounded-lg border border-[var(--paper-lines)]">
              <Lock className="h-5 w-5 text-[var(--accent-sage)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--ink-light)]">
                Your words are private and encrypted. Both of you will receive separate, personalized guidance.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full btn-warm py-6 handwritten text-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Share My Perspective →"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
