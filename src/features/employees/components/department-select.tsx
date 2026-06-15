"use client"

interface DepartmentSelectProps {
  departments: string[]
  value: string
  onChange: (value: string) => void
  includeAll?: boolean
  className?: string
}

export function DepartmentSelect({
  departments,
  value,
  onChange,
  includeAll = true,
  className = "h-8 rounded-lg border border-input bg-input px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
}: DepartmentSelectProps) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={className}>
      {includeAll ? <option value="all">All departments</option> : null}
      {departments.map((department) => (
        <option key={department} value={department}>
          {department}
        </option>
      ))}
    </select>
  )
}
