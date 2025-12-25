import { Button } from "@/components/ui/button"
import { Lock, Clock, Heart, Trash2, PenLine, BookOpen } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] paper-texture">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[var(--accent-warm)]" />
            <span className="handwritten text-2xl text-[var(--ink)]">Bondly</span>
          </div>
          <div className="privacy-badge">
            <Lock className="h-4 w-4 secure-icon" />
            <span>Private & Secure</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="handwritten text-6xl md:text-7xl text-[var(--ink)] leading-tight">
              A safe space for
              <span className="block text-[var(--accent-warm)]">your story</span>
            </h1>
            <p className="text-xl text-[var(--ink-light)] max-w-xl mx-auto leading-relaxed">
              Share your thoughts privately. Understand each other deeply. 
              No accounts, no traces—just honest conversations.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Link href="/session/new">
              <Button className="btn-warm text-lg px-8 py-6 rounded-lg handwritten">
                <PenLine className="h-5 w-5 mr-2" />
                Start Writing
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-[var(--ink-faded)]">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span>Auto-deleted in 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>No sign-up required</span>
            </div>
          </div>
        </div>

        {/* How It Works - Journal Style Cards */}
        <div className="max-w-4xl mx-auto mt-24 space-y-8">
          <h2 className="handwritten text-4xl text-center text-[var(--ink)] mb-12">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-6 stagger-in">
            {/* Step 1 */}
            <div className="journal-card rounded-lg p-6 pl-12">
              <div className="handwritten text-5xl text-[var(--accent-warm)] opacity-30 mb-2">1</div>
              <h3 className="handwritten text-2xl text-[var(--ink)] mb-2">Write your heart</h3>
              <p className="text-[var(--ink-light)] text-sm leading-relaxed">
                Share your perspective on what's happening. Be honest—this is your safe space.
              </p>
            </div>

            {/* Step 2 */}
            <div className="journal-card rounded-lg p-6 pl-12">
              <div className="handwritten text-5xl text-[var(--accent-warm)] opacity-30 mb-2">2</div>
              <h3 className="handwritten text-2xl text-[var(--ink)] mb-2">Share the link</h3>
              <p className="text-[var(--ink-light)] text-sm leading-relaxed">
                Send a private link to your partner. They'll share their side of the story.
              </p>
            </div>

            {/* Step 3 */}
            <div className="journal-card rounded-lg p-6 pl-12">
              <div className="handwritten text-5xl text-[var(--accent-warm)] opacity-30 mb-2">3</div>
              <h3 className="handwritten text-2xl text-[var(--ink)] mb-2">Grow together</h3>
              <p className="text-[var(--ink-light)] text-sm leading-relaxed">
                Receive thoughtful guidance tailored to both perspectives. Start healing.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Promise */}
        <div className="max-w-2xl mx-auto mt-24">
          <div className="journal-card rounded-lg p-8 pl-12 page-shadow">
            <div className="flex items-start gap-4">
              <Heart className="h-8 w-8 text-[var(--accent-warm)] flex-shrink-0 mt-1" />
              <div>
                <h3 className="handwritten text-2xl text-[var(--ink)] mb-3">Our promise to you</h3>
                <ul className="space-y-3 text-[var(--ink-light)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-sage)]">✓</span>
                    <span>Your words are encrypted before they leave your device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-sage)]">✓</span>
                    <span>Everything is automatically erased after 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-sage)]">✓</span>
                    <span>No accounts, no emails, no tracking—just privacy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-sage)]">✓</span>
                    <span>Your relationship journey is yours alone</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 mt-12 border-t border-[var(--paper-lines)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--ink-faded)]">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="handwritten text-lg">Bondly</span>
          </div>
          <p>A safe space for couples to grow together</p>
        </div>
      </footer>
    </div>
  )
}
