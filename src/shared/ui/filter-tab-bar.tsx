import { Button } from "@/shared/ui/button"
import { cn } from "@/lib/utils"

interface FilterTabBarProps<T extends string> {
  options: Array<{ label: string; value: T }>
  value: T
  onChange: (value: T) => void
  className?: string
}

export function FilterTabBar<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterTabBarProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isActive = value === option.value

        return (
          <Button
            key={option.value}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
