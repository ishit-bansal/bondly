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

// Metadata with icons included
export const metadata = {
  title: 'Bondly - Your Safe Space for Relationship Growth',
  description: 'A private, secure space where couples can share perspectives and receive personalized guidance. Your conversations are encrypted and automatically deleted after 24 hours.',
  generator: 'Bondly',
  keywords: ['relationship', 'couples', 'advice', 'communication', 'growth', 'private', 'secure'],
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: '/site.webmanifest',
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
