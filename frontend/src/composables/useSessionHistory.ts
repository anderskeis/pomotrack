import { computed } from 'vue'
import type { SessionType } from './useTimer'
import { useStorage } from './useStorage'

export interface SessionHistoryEntry {
    id: string
    type: SessionType
    label: string
    startedAt: number // timestamp
    completedAt: number // timestamp
    duration: number // seconds
}

export interface SessionHistory {
    entries: SessionHistoryEntry[]
    lastCleared: number // timestamp
}

const MAX_ENTRIES = 100
const STORAGE_KEY = 'session-history'

export function useSessionHistory() {
    const history = useStorage<SessionHistory>(STORAGE_KEY, {
        entries: [],
        lastCleared: Date.now(),
    })

    // Get today's entries only
    const todayEntries = computed(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStart = today.getTime()

        return history.value.entries.filter(
            (entry) => entry.completedAt >= todayStart
        )
    })

    // Today's stats
    const todayStats = computed(() => {
        const entries = todayEntries.value
        const focusSessions = entries.filter((e) => e.type === 'focus')
        const breakSessions = entries.filter((e) => e.type !== 'focus')

        const totalFocusTime = focusSessions.reduce((sum, e) => sum + e.duration, 0)

        // Group by label
        const labelCounts = new Map<string, number>()
        focusSessions.forEach((e) => {
            const label = e.label || 'Unlabeled'
            labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
        })

        return {
            focusCount: focusSessions.length,
            breakCount: breakSessions.length,
            totalFocusMinutes: Math.round(totalFocusTime / 60),
            labelBreakdown: Array.from(labelCounts.entries()).map(([label, count]) => ({
                label,
                count,
            })),
        }
    })

    // Record a completed session
    const recordSession = (
        type: SessionType,
        label: string,
        duration: number,
        startedAt: number
    ) => {
        const entry: SessionHistoryEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            type,
            label: label.trim(),
            startedAt,
            completedAt: Date.now(),
            duration,
        }

        // Add to beginning and limit size
        history.value = {
            ...history.value,
            entries: [entry, ...history.value.entries].slice(0, MAX_ENTRIES),
        }

        return entry
    }

    // Clear all history
    const clearHistory = () => {
        history.value = {
            entries: [],
            lastCleared: Date.now(),
        }
    }

    // Get unique labels for presets
    const recentLabels = computed(() => {
        const labels = new Set<string>()
        history.value.entries.forEach((e) => {
            if (e.label && e.label.trim()) {
                labels.add(e.label)
            }
        })
        return Array.from(labels).slice(0, 10)
    })

    return {
        history,
        todayEntries,
        todayStats,
        recordSession,
        clearHistory,
        recentLabels,
    }
}
