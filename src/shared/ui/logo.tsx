"use client"

import { useId } from "react"

export function Logo() {
  const id = useId().replace(/:/g, "")
  const centerHoleId = `onera-center-hole-${id}`
  const blurMediumId = `onera-blur-medium-${id}`
  const blurSmallId = `onera-blur-small-${id}`
  const ringGradientId = `onera-ring-gradient-${id}`

  return (
    <div className="flex items-center gap-1.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="45 45 110 110"
        className="h-10 w-10 shrink-0"
        aria-hidden="true"
      >
        <defs>
          <mask id={centerHoleId}>
            <rect width="200" height="200" fill="white" />
            <circle cx="100" cy="100" r="29" fill="black" />
          </mask>
          <filter id={blurMediumId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id={blurSmallId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
          <linearGradient id={ringGradientId} x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffdd44" />
            <stop offset="40%" stopColor="#ff6600" />
            <stop offset="100%" stopColor="#b32400" />
          </linearGradient>
        </defs>
        <g mask={`url(#${centerHoleId})`}>
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="12s"
              repeatCount="indefinite"
            />
            <ellipse
              cx="98"
              cy="96"
              rx="40"
              ry="37"
              fill="none"
              stroke="#ff2a00"
              strokeWidth="12"
              filter={`url(#${blurMediumId})`}
              opacity="0.8"
            />
            <ellipse
              cx="103"
              cy="104"
              rx="36"
              ry="42"
              fill="none"
              stroke="#ff5500"
              strokeWidth="14"
              filter={`url(#${blurMediumId})`}
              opacity="0.7"
            />
            <circle
              cx="95"
              cy="102"
              r="39"
              fill="none"
              stroke="#ff1100"
              strokeWidth="10"
              filter={`url(#${blurSmallId})`}
              opacity="0.6"
            />
          </g>
          <circle
            cx="100"
            cy="100"
            r="36"
            fill="none"
            stroke={`url(#${ringGradientId})`}
            strokeWidth="15"
          />
          <circle
            cx="100"
            cy="100"
            r="30.5"
            fill="none"
            stroke="#ffea80"
            strokeWidth="1.5"
            opacity="0.6"
          />
        </g>
      </svg>
      <span className="text-[19px] font-semibold tracking-tight text-navbar-foreground">
        Ontera <span className="text-primary text-sm font-medium">ai</span>
      </span>
    </div>
  )
}
