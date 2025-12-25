import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Bondly - Your Safe Space for Relationship Growth',
  description: 'A private, secure space where couples can share perspectives and receive personalized guidance. Your conversations are encrypted and automatically deleted after 24 hours.',
  generator: 'Bondly',
  keywords: ['relationship', 'couples', 'advice', 'communication', 'growth', 'private', 'secure'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${caveat.variable} ${sourceSerif.variable} font-serif antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
