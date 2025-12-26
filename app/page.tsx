import { Button } from "@/components/ui/button"
import { Lock, Trash2, PenLine, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen diary-bg diary-margin paper-texture">
      {/* Header */}
      <header className="container mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <Image 
              src="/logo.svg" 
              alt="Bondly" 
              width={48} 
              height={48}
              className="float"
            />
            <span className="handwritten text-3xl text-[var(--ink)]">Bondly</span>
          </Link>
          <div className="privacy-badge">
            <Shield className="h-4 w-4 secure-icon" />
            <span>Private & Encrypted</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          
          {/* Logo Large */}
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo.svg" 
              alt="" 
              width={120} 
              height={120}
              className="float opacity-90"
            />
          </div>

          {/* Main Title */}
          <div className="space-y-6">
            <h1 className="handwritten text-6xl md:text-8xl text-[var(--ink)] leading-tight">
              When words feel
              <span className="block text-gradient">hard to say</span>
            </h1>
            <p className="text-xl md:text-2xl text-[var(--ink-light)] max-w-2xl mx-auto leading-relaxed serif-body">
              Sometimes the most important conversations are the hardest to have. 
              Bondly helps couples express their feelings privately, understand each other's 
              perspective, and receive thoughtful guidance—all without judgment.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-6">
            <Link href="/session/new">
              <Button className="btn-warm text-xl md:text-2xl px-10 py-7 rounded-xl handwritten">
                <PenLine className="h-6 w-6 mr-3" />
                Start Your Conversation
              </Button>
            </Link>
            <p className="mt-4 text-base text-[var(--ink-faded)]">
              No sign-up required • Completely free
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 pt-6 text-base text-[var(--ink-faded)]">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <span>Encrypted on your device</span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Deleted after 24 hours</span>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-5xl mx-auto mt-32">
          <h2 className="handwritten text-5xl md:text-6xl text-center text-[var(--ink)] mb-16">
            Three simple steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8 stagger-in">
            {/* Step 1 */}
            <div className="journal-card rounded-xl p-8 pl-14">
              <div className="handwritten text-6xl text-[var(--accent-warm)] opacity-40 mb-3">1</div>
              <h3 className="handwritten text-3xl text-[var(--ink)] mb-3">Write what you feel</h3>
              <p className="text-[var(--ink-light)] text-lg leading-relaxed serif-body">
                Describe the situation from your perspective. Be honest—no one will judge you here.
              </p>
            </div>

            {/* Step 2 */}
            <div className="journal-card rounded-xl p-8 pl-14">
              <div className="handwritten text-6xl text-[var(--accent-warm)] opacity-40 mb-3">2</div>
              <h3 className="handwritten text-3xl text-[var(--ink)] mb-3">Invite your partner</h3>
              <p className="text-[var(--ink-light)] text-lg leading-relaxed serif-body">
                Share a private link. They'll write their side of the story separately.
              </p>
            </div>

            {/* Step 3 */}
            <div className="journal-card rounded-xl p-8 pl-14">
              <div className="handwritten text-6xl text-[var(--accent-warm)] opacity-40 mb-3">3</div>
              <h3 className="handwritten text-3xl text-[var(--ink)] mb-3">Receive guidance</h3>
              <p className="text-[var(--ink-light)] text-lg leading-relaxed serif-body">
                Get personalized advice that considers both perspectives. Start understanding.
              </p>
            </div>
          </div>
        </div>

        {/* Why Bondly */}
        <div className="max-w-3xl mx-auto mt-32">
          <div className="journal-card rounded-xl p-10 pl-16 page-shadow coffee-ring">
            <h3 className="handwritten text-4xl text-[var(--ink)] mb-6">
              Why we built this
            </h3>
            <div className="space-y-4 text-lg text-[var(--ink-light)] serif-body leading-relaxed">
              <p>
                Relationships are hard. When emotions run high, it's easy to talk past each other 
                instead of truly listening. We wanted to create a space where both partners can 
                express themselves fully, without interruption or judgment.
              </p>
              <p>
                Your words are <span className="highlight-mark">encrypted before they leave your device</span>. 
                We can't read them even if we wanted to. Everything is automatically deleted 
                after 24 hours—because some conversations are meant to be private.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-16 mt-16 border-t border-[var(--paper-lines)] relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-base text-[var(--ink-faded)]">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Bondly" width={32} height={32} />
            <span className="handwritten text-2xl text-[var(--ink)]">Bondly</span>
          </div>
          <p className="serif-body">A safe space for couples to understand each other</p>
        </div>
      </footer>
    </div>
  )
}
