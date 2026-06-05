import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { RoleProvider } from "@/shared/lib/role-context"
import { TopNavbar } from "@/shared/ui/top-navbar"

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
      <body className="flex h-dvh flex-col overflow-hidden bg-foreground font-sans">
        <RoleProvider>
          <TopNavbar />
          <main className="min-h-0 flex-1 overflow-hidden rounded-t-[24px] bg-background">
            <div className="h-full flex flex-col items-center overflow-y-auto">{children}</div>
          </main>
        </RoleProvider>
      </body>
    </html>
  )
}
