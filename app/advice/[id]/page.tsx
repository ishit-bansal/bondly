import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, CheckCircle } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

/**
 * Advice Page
 * 
 * Security model:
 * - The advice ID is a UUID (extremely hard to guess)
 * - We use admin client to fetch advice (bypasses RLS)
 * - This is secure because:
 *   1. Only the intended user receives the advice ID (via redirect)
 *   2. The ID is not exposed anywhere public
 *   3. Guessing a valid UUID is practically impossible
 * 
 * This approach solves the "same browser" problem where anonymous auth
 * sessions get overwritten when both partners use the same device.
 */
export default async function AdvicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Validate UUID format to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    redirect("/")
  }

  // Use admin client to bypass RLS (security is via UUID)
  const supabase = await createClient(true)

  // Get advice by ID
  const { data: advice, error: adviceError } = await supabase
    .from("advice")
    .select("*")
    .eq("id", id)
    .single()

  if (adviceError || !advice) {
    redirect("/")
  }

  // Get session for names
  const { data: session } = await supabase
    .from("sessions")
    .select("creator_name, partner_name")
    .eq("id", advice.session_id)
    .single()

  if (!session) {
    redirect("/")
  }

  const userName = advice.is_creator ? session.creator_name : session.partner_name
  const partnerName = advice.is_creator ? session.partner_name : session.creator_name

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Heart className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900">Your Personalized Advice</h1>
          <p className="text-gray-600 mt-2">Here's guidance tailored specifically for you, {userName}</p>
        </div>

        <div className="space-y-6">
          <Card className="border-rose-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-rose-500" />
                <div>
                  <CardTitle className="text-2xl">Understanding the Situation</CardTitle>
                  <CardDescription>Personalized insights for your relationship</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-rose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{advice.advice_text}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-rose-500" />
                <div>
                  <CardTitle className="text-2xl">Action Steps</CardTitle>
                  <CardDescription>Practical steps to move forward</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {advice.action_steps.map((step: string, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 pt-1">{step}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-rose-500" />
                <div>
                  <CardTitle className="text-2xl">Conversation Starters</CardTitle>
                  <CardDescription>Ways to open the dialogue with {partnerName}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {advice.conversation_starters.map((starter: string, index: number) => (
                  <div key={index} className="bg-rose-50 border border-rose-200 p-4 rounded-lg">
                    <p className="text-gray-700 italic">"{starter}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">Remember</h3>
            <p className="text-amber-800 text-sm">
              {partnerName} has also received personalized advice. Consider having an open, honest conversation when
              you're both ready. Take your time to reflect on this guidance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1">
              <Button className="w-full bg-rose-500 hover:bg-rose-600">Start New Session</Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                View All Sessions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
