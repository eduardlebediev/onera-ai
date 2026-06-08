"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ChevronDown, Menu, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/shared/lib/role-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Logo } from "@/shared/ui/logo"

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/documents", label: "Documents" },
  { href: "/tests", label: "Tests" },
  { href: "/employees", label: "Employees" },
  { href: "/analytics", label: "Analytics" },
] as const

const EMPLOYEE_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employee/tests", label: "My Tests" },
  { href: "/progress", label: "Progress" },
] as const

export function TopNavbar() {
  const pathname = usePathname()
  const { role, setRole } = useRole()

  const links = role === "admin" ? ADMIN_LINKS : EMPLOYEE_LINKS
  const userName = role === "admin" ? "Administrator" : "Employee"
  const userTitle = role === "admin" ? "System Administrator" : "Team Member"
  const initials = role === "admin" ? "Ad" : "Em"

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <nav className="flex h-16 shrink-0 items-center gap-3 bg-foreground px-4 md:gap-6 md:px-8">
      {/* Logo */}
      <Link href="/dashboard" className="shrink-0">
        <Logo />
      </Link>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-0.5 flex-1">
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
              <span className="absolute bottom-0 left-3.5 right-3.5 h-[3px] rounded-t-full bg-primary" />
            )}
          </Link>
        ))}
      </div>

      {/* Mobile spacer to push actions right */}
      <div className="flex-1 md:hidden" />

      {/* Right side actions */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {/* Mobile nav menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="md:hidden w-8 h-8 flex items-center justify-center text-background/55 hover:text-background transition-colors rounded-md hover:bg-background/5 cursor-pointer bg-transparent border-0 outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4.5 h-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {links.map((link) => (
              <DropdownMenuItem
                key={link.href}
                className={cn(isActive(link.href) && "text-primary font-medium")}
                asChild
              >
                <Link href={link.href}>{link.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          className="w-8 h-8 flex items-center justify-center text-background/55 hover:text-background transition-colors rounded-md hover:bg-background/5"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center text-background/55 hover:text-background transition-colors rounded-md hover:bg-background/5"
          aria-label="Search"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* Role switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 ml-1 pl-2 pr-1 py-1 rounded-md hover:bg-background/5 transition-colors text-background/90 hover:text-background cursor-pointer bg-transparent border-0 outline-none">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-primary text-[11px] font-semibold">{initials}</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium leading-tight">{userName}</p>
              <p className="text-[10px] text-background/45 leading-tight">{userTitle}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-background/40 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => setRole("admin")}
              className={cn(role === "admin" && "text-primary font-medium")}
            >
              Admin
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setRole("employee")}
              className={cn(role === "employee" && "text-primary font-medium")}
            >
              Employee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
