import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card className="border-rose-200 bg-white/80 backdrop-blur">
          <CardHeader className="text-center">
            <Heart className="h-16 w-16 text-rose-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>We've sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Please check your email and click the confirmation link to activate your account.
            </p>
            <Link href="/">
              <Button variant="outline" className="bg-transparent">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
