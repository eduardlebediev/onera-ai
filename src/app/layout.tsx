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
      <body className="min-h-full flex flex-col font-sans bg-foreground">
        <RoleProvider>
          <TopNavbar />
          <main className="flex flex-1 flex-col bg-background rounded-t-[24px]">{children}</main>
        </RoleProvider>
      </body>
    </html>
  )
}
