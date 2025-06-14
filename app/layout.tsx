import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CouchTalk - AI Therapy Companion',
  description: 'Your personal AI companion for mental wellness. Chat with an empathetic AI therapist trained in CBT and ACT.',
  keywords: 'AI therapy, mental health, CBT, ACT, wellness, anxiety support',
  openGraph: {
    title: 'CouchTalk - AI Therapy Companion',
    description: 'Your safe space to talk about what\'s on your mind',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  )
}