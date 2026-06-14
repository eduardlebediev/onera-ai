import Link from "next/link"
import { Fragment } from "react"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb"

export type BreadcrumbsItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbsItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <Breadcrumb className={cn("typography-small text-muted-foreground", className)}>
      <BreadcrumbList className="flex-nowrap overflow-x-auto">
        {items.map((item, index) => {
          const isLink = Boolean(item.href) && index < items.length - 1

          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator className="text-muted-foreground/60" /> : null}
              <BreadcrumbItem className="shrink-0">
                {isLink && item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
