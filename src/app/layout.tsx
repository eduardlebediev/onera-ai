import type { Metadata } from "next"
import { Geist } from "next/font/google"

import { AppProviders } from "@/shared/components/app-providers"
import { getLocale } from "@/shared/i18n/get-locale"
import { createTranslator } from "@/shared/i18n/translate"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const { t } = createTranslator(locale)

  return {
    title: t("common.appName"),
    description:
      locale === "de"
        ? "KI-gestützte Plattform zur Wissensbewertung von Mitarbeitenden"
        : "AI-powered employee knowledge assessment platform",
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full bg-background font-sans">
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  )
}
