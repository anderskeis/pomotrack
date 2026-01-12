import { watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { SessionType } from './useTimer'

const COLORS = {
    focus: '#ef4444',
    'short-break': '#22c55e',
    'long-break': '#3b82f6',
}

// Original favicon for restoration
const ORIGINAL_FAVICON = '/favicon.svg'

function generateProgressFavicon(
    progress: number,
    sessionType: SessionType,
    remaining: number
): string {
    const color = COLORS[sessionType]
    const size = 32
    const center = size / 2
    const radius = 12
    const strokeWidth = 4

    // Calculate arc
    const progressAngle = (progress / 100) * 360
    const startAngle = -90 // Start at top
    const endAngle = startAngle + progressAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)

    const largeArc = progressAngle > 180 ? 1 : 0

    // Format remaining time for display
    const mins = Math.floor(remaining / 60)
    const displayText = mins > 0 ? `${mins}` : `${remaining}`

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <!-- Background circle -->
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#333" stroke-width="${strokeWidth}" opacity="0.3"/>
      
      <!-- Progress arc -->
      ${progress > 0 ? `
      <path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}" 
            fill="none" 
            stroke="${color}" 
            stroke-width="${strokeWidth}" 
            stroke-linecap="round"/>
      ` : ''}
      
      <!-- Center text -->
      <text x="${center}" y="${center + 1}" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            font-family="sans-serif" 
            font-size="10" 
            font-weight="bold" 
            fill="${color}">
        ${displayText}
      </text>
    </svg>
  `.trim()

    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function useFavicon(
    progress: Ref<number>,
    sessionType: Ref<SessionType>,
    remaining: Ref<number>,
    isRunning: Ref<boolean>
) {
    let linkElement: HTMLLinkElement | null = null

    // Find or create favicon link element
    const getFaviconElement = (): HTMLLinkElement => {
        if (linkElement) return linkElement

        linkElement = document.querySelector('link[rel="icon"]')
        if (!linkElement) {
            linkElement = document.createElement('link')
            linkElement.rel = 'icon'
            document.head.appendChild(linkElement)
        }
        return linkElement
    }

    // Update favicon
    const updateFavicon = () => {
        const el = getFaviconElement()
        if (isRunning.value) {
            el.href = generateProgressFavicon(
                progress.value,
                sessionType.value,
                remaining.value
            )
        } else {
            el.href = ORIGINAL_FAVICON
        }
    }

    // Reset to original
    const resetFavicon = () => {
        const el = getFaviconElement()
        el.href = ORIGINAL_FAVICON
    }

    // Watch for changes
    watch([progress, sessionType, remaining, isRunning], updateFavicon, {
        immediate: true,
    })

    // Cleanup on unmount
    onUnmounted(() => {
        resetFavicon()
    })

    return {
        updateFavicon,
        resetFavicon,
    }
}
