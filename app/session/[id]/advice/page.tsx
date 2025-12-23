import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, CheckCircle } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdvicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch session
  const { data: session } = await supabase.from("sessions").select("*").eq("id", id).single()

  if (!session) {
    redirect("/")
  }

  // Fetch user's advice
  const { data: advice } = await supabase
    .from("advice")
    .select("*")
    .eq("session_id", id)
    .eq("user_id", user.id)
    .single()

  if (!advice) {
    redirect("/")
  }

  const isCreator = advice.is_creator
  const userName = isCreator ? session.creator_name : session.partner_name
  const partnerName = isCreator ? session.partner_name : session.creator_name

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
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full bg-rose-500 hover:bg-rose-600">View All Sessions</Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Start New Session
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
