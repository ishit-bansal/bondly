"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const emotions = [
  "Frustrated",
  "Sad",
  "Angry",
  "Hurt",
  "Confused",
  "Anxious",
  "Hopeful",
  "In Love",
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
    setSelectedEmotions((prev) => (prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      let currentUserId = user?.id

      if (!user) {
        // Create anonymous session with proper authentication
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

        if (authError) throw authError
        if (!authData.user) throw new Error("Failed to create anonymous user")
        currentUserId = authData.user.id
      }

      console.log("[v0] Current user ID:", currentUserId)

      // Generate share token
      const shareToken = crypto.randomUUID()

      console.log("[v0] Creating session with creator_id:", currentUserId)

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

      if (sessionError) {
        console.error("[v0] Session creation error:", sessionError)
        throw sessionError
      }

      console.log("[v0] Session created:", session)

      // Create creator's response
      const { error: responseError } = await supabase.from("responses").insert({
        session_id: session.id,
        user_id: currentUserId,
        is_creator: true,
        situation_description: situation,
        feelings: feelings,
        emotional_state: selectedEmotions,
      })

      if (responseError) {
        console.error("[v0] Response creation error:", responseError)
        throw responseError
      }

      console.log("[v0] Response created successfully")

      // Redirect to share page
      router.push(`/session/${session.id}/share`)
    } catch (err) {
      console.error("[v0] Error creating session:", err)
      setError(err instanceof Error ? err.message : "Failed to create session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-rose-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Start a New Session</CardTitle>
            <CardDescription>
              Share your perspective on the situation. Your partner will receive a link to share theirs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="yourName">Your Name</Label>
                <Input
                  id="yourName"
                  placeholder="e.g., Alex"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value.slice(0, 50))}
                  required
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerName">Partner's Name</Label>
                <Input
                  id="partnerName"
                  placeholder="e.g., Jordan"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value.slice(0, 50))}
                  required
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="situation">Describe the situation from your perspective</Label>
                <Textarea
                  id="situation"
                  placeholder="What happened? What's the issue you're facing?"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value.slice(0, 2000))}
                  required
                  rows={5}
                  className="resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 text-right">{situation.length}/2000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feelings">How do you feel about this situation?</Label>
                <Textarea
                  id="feelings"
                  placeholder="Express your emotions and thoughts..."
                  value={feelings}
                  onChange={(e) => setFeelings(e.target.value.slice(0, 1000))}
                  required
                  rows={4}
                  className="resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 text-right">{feelings.length}/1000</p>
              </div>

              <div className="space-y-3">
                <Label>Select your current emotions (choose all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {emotions.map((emotion) => (
                    <div key={emotion} className="flex items-center gap-2">
                      <Checkbox
                        id={emotion}
                        checked={selectedEmotions.includes(emotion)}
                        onCheckedChange={() => toggleEmotion(emotion)}
                      />
                      <Label htmlFor={emotion} className="cursor-pointer font-normal">
                        {emotion}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
                {isLoading ? "Creating Session..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
