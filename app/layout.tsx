import type { Metadata } from 'next'
import { Inter, Crimson_Text } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

const crimsonText = Crimson_Text({ 
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
})

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
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={`${inter.variable} ${crimsonText.variable}`}>
      <body className={`${inter.className} font-sans`}>
        {children}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}