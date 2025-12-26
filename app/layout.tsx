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
  title: 'Bondly - Your Safe Space for Relationship Growth',
  description: 'A private, secure space where couples can share perspectives and receive personalized guidance. Your conversations are encrypted and automatically deleted after 24 hours.',
  generator: 'Bondly',
  keywords: ['relationship', 'couples', 'advice', 'communication', 'growth', 'private', 'secure'],
  // Removed old icons completely
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />

        {/* New favicon setup */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${caveat.variable} ${sourceSerif.variable} font-serif antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}