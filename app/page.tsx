import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Heart className="h-12 w-12 text-rose-500" />
            <h1 className="text-5xl font-bold text-gray-900">Relationship Helper</h1>
          </div>

          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
            Work through relationship challenges together. Share your perspectives, get personalized AI-powered advice,
            and build a stronger connection.
          </p>

          <div className="flex gap-4 mt-4">
            <Link href="/session/new">
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white px-8">
                Start a Session
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-8 bg-transparent">
                View History
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16 w-full">
            <Card className="border-rose-200 bg-white/80 backdrop-blur">
              <CardHeader>
                <Users className="h-10 w-10 text-rose-500 mb-2" />
                <CardTitle>Both Perspectives</CardTitle>
                <CardDescription>Each partner shares their view of the situation independently</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-rose-200 bg-white/80 backdrop-blur">
              <CardHeader>
                <MessageCircle className="h-10 w-10 text-rose-500 mb-2" />
                <CardTitle>AI-Powered Advice</CardTitle>
                <CardDescription>
                  Get personalized feedback that validates feelings and suggests actionable steps
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-rose-200 bg-white/80 backdrop-blur">
              <CardHeader>
                <Heart className="h-10 w-10 text-rose-500 mb-2" />
                <CardTitle>Grow Together</CardTitle>
                <CardDescription>
                  Build understanding with conversation starters and conflict resolution strategies
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
