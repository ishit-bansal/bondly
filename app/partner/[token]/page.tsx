"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import type { Session } from "@/lib/types"

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

export default function PartnerResponsePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("")
  const [session, setSession] = useState<Session | null>(null)
  const [situation, setSituation] = useState("")
  const [feelings, setFeelings] = useState("")
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    params.then((p) => setToken(p.token))
  }, [params])

  useEffect(() => {
    if (!token) return

    const fetchSession = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("sessions").select("*").eq("share_token", token).single()

      if (error || !data) {
        setError("Session not found")
        setIsLoading(false)
        return
      }

      if (data.status === "analyzed") {
        setError("This session has already been completed")
        setIsLoading(false)
        return
      }

      setSession(data)
      setIsLoading(false)
    }

    fetchSession()
  }, [token])

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) => (prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]))
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
      if (!authData.user) throw new Error("Failed to create user")

      // Create partner's response
      const { data: insertedResponse, error: responseError } = await supabase
        .from("responses")
        .insert({
          session_id: session.id,
          user_id: authData.user.id,
          is_creator: false,
          situation_description: situation,
          feelings: feelings,
          emotional_state: selectedEmotions,
        })
        .select()
        .single()

      if (responseError) {
        console.error("[Partner] Response insert error:", responseError)
        throw responseError
      }

      if (!insertedResponse) {
        console.error("[Partner] No response data returned from insert")
        throw new Error("Failed to save response")
      }

      // Small delay to ensure DB consistency
      await new Promise(resolve => setTimeout(resolve, 300))

      // Update session status
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ status: "completed" })
        .eq("id", session.id)

      if (updateError) {
        throw updateError
      }
      
      // Trigger AI analysis
      const response = await fetch("/api/analyze-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (responseData.code === "QUOTA_EXCEEDED" || response.status === 429) {
          setError("The AI service has reached its daily limit. Your response has been saved. Please check back tomorrow for your personalized advice, or contact support.")
          setTimeout(() => {
            router.push(`/session/${session.id}/processing`)
          }, 3000)
          return
        }
        throw new Error(responseData.error || "Failed to analyze session")
      }

      // Redirect to unique advice page using advice ID
      if (responseData.adviceIds) {
        // Partner gets their own unique advice URL
        const partnerAdviceId = responseData.adviceIds.partner
        if (partnerAdviceId) {
          router.push(`/advice/${partnerAdviceId}`)
          return
        }
      }
      
      // Fallback: redirect to processing page
      router.push(`/session/${session.id}/processing`)
    } catch (err) {
      console.error("[v0] Error submitting response:", err)
      setError(err instanceof Error ? err.message : "Failed to submit response")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center px-4">
        <Card className="max-w-md border-rose-200">
          <CardHeader>
            <CardTitle>Oops!</CardTitle>
            <CardDescription>{error || "Something went wrong"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Hi {session.partner_name}!</h1>
          <p className="text-gray-600 mt-2">
            {session.creator_name} wants to work through something with you. Share your perspective below.
          </p>
        </div>

        <Card className="border-rose-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Your Turn to Share</CardTitle>
            <CardDescription>
              Your responses will remain private. Both of you will receive personalized advice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="situation">Describe the situation from your perspective</Label>
                <Textarea
                  id="situation"
                  placeholder="What happened? What's your view of the issue?"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  required
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feelings">How do you feel about this situation?</Label>
                <Textarea
                  id="feelings"
                  placeholder="Express your emotions and thoughts..."
                  value={feelings}
                  onChange={(e) => setFeelings(e.target.value)}
                  required
                  rows={4}
                  className="resize-none"
                />
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

              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Your Response"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
