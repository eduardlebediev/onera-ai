"use client"

import { useState, useEffect, useActionState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { loginAction, type LoginState } from "@/features/auth/actions/login"
import { AuthLanguageSwitcher } from "@/features/auth/components/auth-language-switcher"
import { AuthThemeToggle } from "@/features/auth/components/auth-theme-toggle"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Logo } from "@/shared/ui/logo"

const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"
const DEMO_PASSWORD = "demo-only-password"

export function LoginForm() {
  const { t } = useTranslation()
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginAction, null)

  const carouselSlides = [
    {
      title: t("auth.carousel.slide1Title"),
      description: t("auth.carousel.slide1Description"),
    },
    {
      title: t("auth.carousel.slide2Title"),
      description: t("auth.carousel.slide2Description"),
    },
    {
      title: t("auth.carousel.slide3Title"),
      description: t("auth.carousel.slide3Description"),
    },
  ]

  const [email, setEmail] = useState(DEMO_LOGIN_ENABLED ? "admin@demo.ontera.ai" : "")
  const [password, setPassword] = useState(DEMO_LOGIN_ENABLED ? DEMO_PASSWORD : "")
  const [showPassword, setShowPassword] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [carouselSlides.length])

  const handleQuickFill = (role: "admin" | "employee") => {
    if (role === "admin") {
      setEmail("admin@demo.ontera.ai")
      setPassword(DEMO_PASSWORD)
    } else {
      setEmail("employee@demo.ontera.ai")
      setPassword(DEMO_PASSWORD)
    }
  }

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-y-auto bg-navbar font-sans md:h-dvh md:flex-row md:overflow-hidden">
      <aside
        className="flex w-full flex-col items-center justify-center border-b border-navbar-foreground/10 px-(--spacing-page-x) py-6 md:min-h-full md:w-1/2 md:items-stretch md:justify-between md:border-b-0 md:p-16"
        id="login-left-panel"
      >
        <div className="md:hidden">
          <Logo />
        </div>

        <div className="hidden md:block" />

        <div className="my-auto hidden flex-col items-center text-center md:flex md:py-8">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>

          <div className="relative flex min-h-[160px] w-full flex-col items-center justify-start overflow-hidden px-4">
            <div className="w-full text-center transition-opacity duration-300">
              <h1 className="mx-auto max-w-[420px] text-2xl font-bold leading-tight tracking-tight text-navbar-foreground sm:text-[30px] lg:text-[32px]">
                {carouselSlides[currentSlide].title}
              </h1>
              <p className="mx-auto mt-4 max-w-[380px] text-[13px] leading-relaxed text-navbar-foreground/55 sm:text-[14px]">
                {carouselSlides[currentSlide].description}
              </p>
            </div>
          </div>

          <div className="relative z-20 mt-8 flex items-center justify-center gap-2.5">
            {carouselSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "h-1.5 cursor-pointer rounded-full transition-all duration-300 focus:outline-none",
                  idx === currentSlide
                    ? "w-5 bg-navbar-foreground"
                    : "w-1.5 bg-navbar-foreground/30 hover:bg-navbar-foreground/60"
                )}
                aria-label={t("auth.carousel.goToSlide", { number: idx + 1 })}
              />
            ))}
          </div>
        </div>

        <div className="hidden md:block" />
      </aside>

      <main
        className="flex w-full flex-1 flex-col rounded-t-[24px] bg-background px-(--spacing-page-x) py-10 text-foreground sm:py-12 md:min-h-full md:w-1/2 md:flex-none md:rounded-none md:rounded-l-[24px] md:p-16"
        id="login-right-panel"
      >
        <div className="mb-6 flex justify-center gap-2 sm:mb-8 md:mb-10 md:justify-end">
          <AuthLanguageSwitcher />
          <AuthThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-4 sm:py-6">
          <div className="mb-8 text-center">
            <h2 className="typography-h2 text-foreground">{t("auth.signInTitle")}</h2>
            <p className="typography-small mt-1.5 text-muted-foreground">
              {t("auth.signInSubtitle")}
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="typography-label text-foreground">
                {t("auth.email")}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="h-11"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="typography-label text-foreground">
                {t("auth.password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="h-11 pr-10"
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {state?.error ? (
              <p className="typography-small pl-1 text-destructive" role="alert">
                {state.error}
              </p>
            ) : null}

            {DEMO_LOGIN_ENABLED ? (
              <div className="flex flex-col items-center gap-3 pt-1 text-center select-none">
                <span className="typography-small text-muted-foreground">{t("auth.demoHint")}</span>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleQuickFill("admin")}
                    className={cn(
                      email.includes("admin") && "border-primary bg-primary/10 text-foreground"
                    )}
                    disabled={isPending}
                  >
                    {t("auth.demoAdmin")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleQuickFill("employee")}
                    className={cn(
                      email.includes("employee") && "border-primary bg-primary/10 text-foreground"
                    )}
                    disabled={isPending}
                  >
                    {t("auth.demoEmployee")}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="pt-2">
              <Button
                type="submit"
                variant="brand"
                size="xl"
                className="w-full"
                disabled={isPending}
                id="submit-signin-btn"
              >
                {isPending ? t("auth.signingIn") : `${t("auth.signIn")} →`}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
