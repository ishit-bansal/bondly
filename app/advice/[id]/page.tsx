import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { MessageCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default async function AdvicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    redirect("/")
  }

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
    <div className="min-h-screen diary-bg diary-margin paper-texture py-12 px-4">
      <div className="container mx-auto max-w-3xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2 text-[var(--ink-light)] hover:text-[var(--ink)] transition">
            <ArrowLeft className="h-5 w-5" />
            <span className="handwritten text-xl">Home</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Bondly" width={36} height={36} />
            <span className="handwritten text-2xl text-[var(--ink)]">Bondly</span>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="handwritten text-6xl text-[var(--ink)] mb-3">
            Dear {userName}...
          </h1>
          <p className="text-xl text-[var(--ink-light)] serif-body">Here's some guidance just for you</p>
        </div>

        <div className="space-y-10">
          {/* Main Advice */}
          <div className="journal-card rounded-xl p-10 pl-14 page-shadow">
            <h2 className="handwritten text-3xl text-[var(--accent-warm)] mb-5">
              Understanding Your Situation
            </h2>
            <div className="text-lg text-[var(--ink)] leading-relaxed whitespace-pre-wrap serif-body">
              {advice.advice_text}
            </div>
          </div>

          {/* Action Steps */}
          <div className="journal-card rounded-xl p-10 pl-14 page-shadow">
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle className="h-7 w-7 text-[var(--accent-sage)]" />
              <h2 className="handwritten text-3xl text-[var(--ink)]">Things to Try</h2>
            </div>
            <ul className="space-y-5">
              {advice.action_steps.map((step: string, index: number) => (
                <li key={index} className="flex gap-4">
                  <span className="handwritten text-3xl text-[var(--accent-warm)] opacity-50">
                    {index + 1}.
                  </span>
                  <p className="text-lg text-[var(--ink-light)] pt-1 serif-body">{step}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Conversation Starters */}
          <div className="journal-card rounded-xl p-10 pl-14 page-shadow">
            <div className="flex items-center gap-3 mb-5">
              <MessageCircle className="h-7 w-7 text-[var(--accent-warm)]" />
              <h2 className="handwritten text-3xl text-[var(--ink)]">
                Words to Start With
              </h2>
            </div>
            <p className="text-base text-[var(--ink-faded)] mb-5 serif-body">
              When you're ready to talk to {partnerName}, try opening with:
            </p>
            <div className="space-y-4">
              {advice.conversation_starters.map((starter: string, index: number) => (
                <div key={index} className="bg-[var(--highlight)] border border-[var(--paper-lines)] p-5 rounded-xl">
                  <p className="text-[var(--ink)] italic handwritten text-xl">"{starter}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="bg-[var(--highlight)] border border-[var(--paper-lines)] p-8 rounded-xl">
            <h3 className="handwritten text-2xl text-[var(--ink)] mb-3">Remember...</h3>
            <p className="text-[var(--ink-light)] text-base serif-body">
              {partnerName} has also received their own personalized guidance. Take your time to reflect, 
              and when you're both ready, have an open and honest conversation. You've got this. ♡
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1">
              <Button className="w-full btn-warm py-6 handwritten text-lg">
                Start a New Conversation
              </Button>
            </Link>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-xs text-[var(--ink-faded)]">
            This page will be automatically deleted in 24 hours for your privacy.
          </p>
        </div>
      </div>
    </div>
  )
}
