import type { Metadata } from "next"
import localFont from "next/font/local"

import { AppProviders } from "@/shared/components/app-providers"
import { getLocale } from "@/shared/i18n/get-locale"
import { createTranslator } from "@/shared/i18n/translate"

import "./globals.css"

const geistSans = localFont({
  variable: "--font-geist-sans",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  src: [
    {
      path: "./fonts/geist-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/geist-medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/geist-semibold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/geist-bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const { t } = createTranslator(locale)
  const appName = t("common.appName")
  const description =
    locale === "de"
      ? "KI-gestützte Plattform zur Wissensbewertung von Mitarbeitenden"
      : "AI-powered employee knowledge assessment platform"

  return {
    title: appName,
    description,
    applicationName: appName,
    icons: {
      icon: [{ url: "/favicon.ico" }],
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-background font-sans">
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  )
}
