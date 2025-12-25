"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { generateEncryptionKey, encryptText } from "@/lib/encryption"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, BookOpen } from "lucide-react"
import Link from "next/link"

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

export default function NewSessionPage() {
  const [yourName, setYourName] = useState("")
  const [partnerName, setPartnerName] = useState("")
  const [situation, setSituation] = useState("")
  const [feelings, setFeelings] = useState("")
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) => 
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Always create anonymous session - no sign-in required
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create session")
      
      const currentUserId = authData.user.id

      // Generate encryption key for this session
      const encryptionKey = await generateEncryptionKey()

      // Encrypt sensitive data client-side
      const encryptedSituation = await encryptText(situation, encryptionKey)
      const encryptedFeelings = await encryptText(feelings, encryptionKey)
      const encryptedEmotions = await encryptText(JSON.stringify(selectedEmotions), encryptionKey)

      // Generate share token
      const shareToken = crypto.randomUUID()

      // Create session with encrypted data
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          creator_id: currentUserId,
          creator_name: yourName, // Names are not encrypted (needed for display)
          partner_name: partnerName,
          share_token: shareToken,
          status: "waiting_for_partner",
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create encrypted response
      const { error: responseError } = await supabase.from("responses").insert({
        session_id: session.id,
        user_id: currentUserId,
        is_creator: true,
        situation_description: encryptedSituation,
        feelings: encryptedFeelings,
        emotional_state: [encryptedEmotions], // Store as single encrypted string
      })

      if (responseError) throw responseError

      // Redirect to share page with encryption key in URL fragment (not sent to server)
      router.push(`/session/${session.id}/share#key=${encryptionKey}`)
    } catch (err) {
      console.error("Error creating session:", err)
      setError(err instanceof Error ? err.message : "Failed to create session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] paper-texture py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-[var(--ink-light)] hover:text-[var(--ink)] transition">
            <ArrowLeft className="h-4 w-4" />
            <span className="handwritten text-lg">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--accent-warm)]" />
            <span className="handwritten text-xl text-[var(--ink)]">Bondly</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="journal-card rounded-lg p-8 pl-12 page-shadow">
          <div className="mb-6">
            <h1 className="handwritten text-4xl text-[var(--ink)] mb-2">Dear diary...</h1>
            <p className="text-[var(--ink-light)]">
              Share your perspective. Your partner will receive a link to share theirs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Names Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yourName" className="text-[var(--ink)]">Your name</Label>
                <Input
                  id="yourName"
                  placeholder="Alex"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value.slice(0, 50))}
                  required
                  maxLength={50}
                  className="handwritten text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerName" className="text-[var(--ink)]">Partner's name</Label>
                <Input
                  id="partnerName"
                  placeholder="Jordan"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value.slice(0, 50))}
                  required
                  maxLength={50}
                  className="handwritten text-lg"
                />
              </div>
            </div>

            {/* Situation */}
            <div className="space-y-2">
              <Label htmlFor="situation" className="text-[var(--ink)]">
                What's on your mind?
              </Label>
              <Textarea
                id="situation"
                placeholder="Tell your story... What happened? What's troubling you?"
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
                How does this make you feel?
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
                Your words are encrypted before leaving your device. 
                Everything is automatically deleted after 24 hours.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full btn-warm py-6 handwritten text-xl"
              disabled={isLoading}
            >
              {isLoading ? "Saving your thoughts..." : "Continue →"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
