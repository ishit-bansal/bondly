import { Caveat, Source_Serif_4 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Handwritten font for headings and accents
const caveat = Caveat({ 
  subsets: ["latin"],
  variable: '--font-handwritten'
})

// Elegant serif for body text - diary feel
const sourceSerif = Source_Serif_4({ 
  subsets: ["latin"],
  variable: '--font-serif'
})

export const metadata = {
  title: 'Bondly - When Words Feel Hard to Say',
  description: 'A private, encrypted space where couples can share perspectives and receive personalized guidance. Your conversations are automatically deleted after 24 hours.',
  keywords: ['relationship', 'couples', 'advice', 'communication', 'growth', 'private', 'secure', 'encrypted'],
  metadataBase: new URL('https://bondly.ishitbansal.com'),
  openGraph: {
    title: 'Bondly - When Words Feel Hard to Say',
    description: 'A private, encrypted space where couples can share perspectives and receive personalized guidance.',
    url: 'https://bondly.ishitbansal.com',
    siteName: 'Bondly',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bondly - When Words Feel Hard to Say',
    description: 'A private, encrypted space where couples can share perspectives and receive personalized guidance.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${caveat.variable} ${sourceSerif.variable} font-serif antialiased`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
