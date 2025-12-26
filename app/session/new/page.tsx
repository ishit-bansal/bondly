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
import { ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create session")
      
      const currentUserId = authData.user.id
      const encryptionKey = await generateEncryptionKey()

      const encryptedSituation = await encryptText(situation, encryptionKey)
      const encryptedFeelings = await encryptText(feelings, encryptionKey)
      const encryptedEmotions = await encryptText(JSON.stringify(selectedEmotions), encryptionKey)

      const shareToken = crypto.randomUUID()

      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          creator_id: currentUserId,
          creator_name: yourName,
          partner_name: partnerName,
          share_token: shareToken,
          status: "waiting_for_partner",
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      const { error: responseError } = await supabase.from("responses").insert({
        session_id: session.id,
        user_id: currentUserId,
        is_creator: true,
        situation_description: encryptedSituation,
        feelings: encryptedFeelings,
        emotional_state: [encryptedEmotions],
      })

      if (responseError) throw responseError

      router.push(`/session/${session.id}/share#key=${encryptionKey}`)
    } catch (err) {
      console.error("Error creating session:", err)
      setError(err instanceof Error ? err.message : "Failed to create session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen diary-bg diary-margin paper-texture py-12 px-4">
      <div className="container mx-auto max-w-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2 text-[var(--ink-light)] hover:text-[var(--ink)] transition">
            <ArrowLeft className="h-5 w-5" />
            <span className="handwritten text-xl">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Bondly" width={36} height={36} />
            <span className="handwritten text-2xl text-[var(--ink)]">Bondly</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="journal-card rounded-xl p-10 pl-14 page-shadow">
          <div className="mb-8">
            <h1 className="handwritten text-5xl text-[var(--ink)] mb-3">Dear diary...</h1>
            <p className="text-lg text-[var(--ink-light)] serif-body">
              Share your perspective honestly. Your partner will receive a link to share theirs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Names Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="yourName" className="text-[var(--ink)] text-lg">Your name</Label>
                <Input
                  id="yourName"
                  placeholder="Alex"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value.slice(0, 50))}
                  required
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerName" className="text-[var(--ink)] text-lg">Partner's name</Label>
                <Input
                  id="partnerName"
                  placeholder="Jordan"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value.slice(0, 50))}
                  required
                  maxLength={50}
                />
              </div>
            </div>

            {/* Situation */}
            <div className="space-y-3">
              <Label htmlFor="situation" className="text-[var(--ink)] text-lg">
                What's happening?
              </Label>
              <Textarea
                id="situation"
                placeholder="Describe the situation from your perspective... What happened? What's troubling you?"
                value={situation}
                onChange={(e) => setSituation(e.target.value.slice(0, 2000))}
                required
                rows={6}
                className="resize-none"
                maxLength={2000}
              />
              <p className="text-sm text-[var(--ink-faded)] text-right">{situation.length}/2000</p>
            </div>

            {/* Feelings */}
            <div className="space-y-3">
              <Label htmlFor="feelings" className="text-[var(--ink)] text-lg">
                How does this make you feel?
              </Label>
              <Textarea
                id="feelings"
                placeholder="Express your emotions... What are you feeling right now?"
                value={feelings}
                onChange={(e) => setFeelings(e.target.value.slice(0, 1000))}
                required
                rows={4}
                className="resize-none"
                maxLength={1000}
              />
              <p className="text-sm text-[var(--ink-faded)] text-right">{feelings.length}/1000</p>
            </div>

            {/* Emotions */}
            <div className="space-y-4">
              <Label className="text-[var(--ink)] text-lg">I'm feeling... (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-4">
                {emotions.map((emotion) => (
                  <div key={emotion} className="flex items-center gap-3">
                    <Checkbox
                      id={emotion}
                      checked={selectedEmotions.includes(emotion)}
                      onCheckedChange={() => toggleEmotion(emotion)}
                    />
                    <Label 
                      htmlFor={emotion} 
                      className="cursor-pointer font-normal text-[var(--ink-light)] text-lg handwritten"
                    >
                      {emotion}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-base text-[var(--destructive)] bg-red-50 p-4 rounded-lg">
                {error}
              </p>
            )}

            {/* Privacy Note */}
            <div className="flex items-start gap-4 p-5 bg-[var(--highlight)] rounded-xl border border-[var(--paper-lines)]">
              <Lock className="h-6 w-6 text-[var(--accent-sage)] flex-shrink-0 mt-0.5" />
              <p className="text-base text-[var(--ink-light)] serif-body">
                Your words are <strong>encrypted</strong> before leaving your device. 
                Everything is automatically <strong>deleted after 24 hours</strong>.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full btn-warm py-7 handwritten text-2xl rounded-xl"
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
