import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: 'Watchio — Watch Together. Feel Together.',
  description: 'Real-time YouTube watch parties with synchronized playback, live chat, and role-based access control. Watch with friends, anywhere.',
  keywords: ['watch party', 'youtube', 'watch together', 'synchronized video', 'real-time', 'streaming'],
  authors: [{ name: 'Watchio' }],
  openGraph: {
    title: 'Watchio — Watch Together. Feel Together.',
    description: 'Real-time YouTube watch parties with synchronized playback, live chat, and role-based access control.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watchio — Watch Together. Feel Together.',
    description: 'Real-time YouTube watch parties with synchronized playback, live chat, and role-based access control.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0d0d14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
