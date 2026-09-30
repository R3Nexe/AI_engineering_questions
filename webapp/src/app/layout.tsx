import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Geist } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-code',
  display: 'swap',
})

export const metadata: Metadata = { title: 'AI Interview Prep' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("h-full", inter.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <head>
        {/* impeccable-disable overused-font -- User confirmed Linear typography stack */}
      </head>
      <body className="h-full antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
