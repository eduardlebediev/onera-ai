"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Menu } from "lucide-react"

import type { AppRole } from "@/features/auth/lib/current-user"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Logo } from "@/shared/ui/logo"

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/tests", label: "Tests" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/analytics", label: "Analytics" },
] as const

const EMPLOYEE_LINKS = [
  { href: "/employee/dashboard", label: "Dashboard" },
  { href: "/employee/tests", label: "My Tests" },
  { href: "/employee/progress", label: "Progress" },
] as const

type TopNavbarProps = {
  role: AppRole
  userName: string
  userTitle: string
}

export function TopNavbar({ role, userName, userTitle }: TopNavbarProps) {
  const pathname = usePathname()

  const links = role === "admin" ? ADMIN_LINKS : EMPLOYEE_LINKS
  const dashboardHref = role === "admin" ? "/admin/dashboard" : "/employee/dashboard"
  const initials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "U"

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="flex h-16 shrink-0 items-center gap-3 bg-foreground px-4 md:gap-6 md:px-8">
      <Link href={dashboardHref} className="shrink-0">
        <Logo />
      </Link>

      <div className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative flex h-16 items-center px-3.5 text-sm font-medium transition-colors",
              isActive(link.href)
                ? "text-background"
                : "text-background/55 hover:text-background/85"
            )}
          >
            {link.label}
            {isActive(link.href) && (
              <span className="absolute right-3.5 bottom-0 left-3.5 h-[3px] rounded-t-full bg-primary" />
            )}
          </Link>
        ))}
      </div>

      <div className="flex-1 md:hidden" />

      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-background/55 outline-none transition-colors hover:bg-background/5 hover:text-background md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {links.map((link) => (
              <DropdownMenuItem
                key={link.href}
                className={cn(isActive(link.href) && "font-medium text-primary")}
                asChild
              >
                <Link href={link.href}>{link.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent py-1 pr-1 pl-2 text-background/90 outline-none transition-colors hover:bg-background/5 hover:text-background">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
              <span className="text-[11px] font-semibold text-primary">{initials}</span>
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs leading-tight font-medium">{userName}</p>
              <p className="text-[10px] leading-tight text-background/45">{userTitle}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-background/40" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <form action="/auth/logout" method="post" className="w-full">
                <button type="submit" className="w-full cursor-pointer text-left">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
