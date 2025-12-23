import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CopyButton } from "@/components/copy-button"

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session, error } = await supabase.from("sessions").select("*").eq("id", id).single()

  if (error || !session) {
    redirect("/")
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/partner/${session.share_token}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full border-rose-200 bg-white/80 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-16 w-16 text-rose-500" />
          </div>
          <CardTitle className="text-3xl">Thanks for sharing, {session.creator_name}!</CardTitle>
          <CardDescription className="text-base mt-2">
            Now it's time for {session.partner_name} to share their perspective
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-rose-50 p-6 rounded-lg border border-rose-200">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Share this link with your partner:</Label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm"
              />
              <CopyButton text={shareUrl} />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>What happens next?</strong> Once {session.partner_name} completes their response, we'll generate
              personalized advice for both of you. You'll each receive feedback tailored to your perspective.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard">
              <Button className="w-full bg-rose-500 hover:bg-rose-600">Go to Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
