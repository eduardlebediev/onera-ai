import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { Toaster } from "@/shared/ui/sonner"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Ontera AI",
  description: "AI-powered employee knowledge assessment platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full bg-background font-sans">
        <NuqsAdapter>
          {children}
          <Toaster duration={4000} position="top-right" richColors />
        </NuqsAdapter>
      </body>
    </html>
  )
}
