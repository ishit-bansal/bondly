import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Clock, CheckCircle, HourglassIcon } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="h-10 w-10 text-rose-500" />
              Your Sessions
            </h1>
            <p className="text-gray-600 mt-2">Track your relationship growth journey</p>
          </div>
          <Link href="/session/new">
            <Button className="bg-rose-500 hover:bg-rose-600">Start New Session</Button>
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <Card className="border-rose-200 bg-white/80 backdrop-blur">
            <CardContent className="py-16 text-center">
              <Heart className="h-16 w-16 text-rose-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600 mb-6">Start your first session to get personalized relationship advice</p>
              <Link href="/session/new">
                <Button className="bg-rose-500 hover:bg-rose-600">Create Your First Session</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="border-rose-200 bg-white/80 backdrop-blur hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        Session with {session.partner_name}
                        {session.status === "analyzed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {session.status === "waiting_for_partner" && (
                          <HourglassIcon className="h-5 w-5 text-amber-500" />
                        )}
                        {session.status === "completed" && <Clock className="h-5 w-5 text-blue-500" />}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Created{" "}
                        {new Date(session.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={session.status === "analyzed" ? "default" : "secondary"}
                      className={
                        session.status === "analyzed"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : session.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                      }
                    >
                      {session.status === "analyzed"
                        ? "Complete"
                        : session.status === "completed"
                          ? "Processing"
                          : "Waiting for Partner"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {session.status === "analyzed" ? (
                      <Link href={`/session/${session.id}/advice`} className="flex-1">
                        <Button className="w-full bg-rose-500 hover:bg-rose-600">View Advice</Button>
                      </Link>
                    ) : session.status === "waiting_for_partner" ? (
                      <Link href={`/session/${session.id}/share`} className="flex-1">
                        <Button className="w-full bg-rose-500 hover:bg-rose-600">Share Link</Button>
                      </Link>
                    ) : (
                      <Link href={`/session/${session.id}/processing`} className="flex-1">
                        <Button className="w-full bg-blue-500 hover:bg-blue-600">Check Status</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" className="bg-transparent">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
