"use client"

import { FormEvent, useState } from "react"

import { Button } from "@/shared/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer"
import { Input } from "@/shared/ui/input"

interface InviteEmployeeModalProps {
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { fullName: string; email: string }) => Promise<void>
}

export function InviteEmployeeModal({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: InviteEmployeeModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ fullName, email })
    setFullName("")
    setEmail("")
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Invite employee</DrawerTitle>
            <DrawerDescription>
              Create an employee invite and send onboarding details.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <label className="block space-y-1.5">
              <span className="typography-small font-medium">Full name</span>
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder="Alex Morgan"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="typography-small font-medium">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="alex@company.com"
              />
            </label>
          </div>
          <DrawerFooter className="mt-auto">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Inviting..." : "Invite & send onboarding"}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
