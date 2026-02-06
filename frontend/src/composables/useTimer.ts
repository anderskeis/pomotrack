import { ref, computed, onUnmounted, watch } from 'vue'
import { getStorageValue, setStorageValue } from './useStorage'

export type SessionType = 'focus' | 'short-break' | 'long-break'
export type UrgencyLevel = 'normal' | 'warning' | 'critical'

export interface TimerConfig {
    focusDuration: number // minutes
    shortBreakDuration: number // minutes
    longBreakDuration: number // minutes
    pomodorosUntilLongBreak: number
    autoStartBreaks: boolean
    autoStartFocus: boolean
    dailyGoal: number
}

export interface TimerState {
    remaining: number // seconds
    isRunning: boolean
    sessionType: SessionType
    completedPomodoros: number
    completedBreaks: number
}

export const defaultConfig: TimerConfig = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    dailyGoal: 8,
}

export function useTimer(
    config = ref<TimerConfig>(defaultConfig),
    onSessionComplete?: (sessionType: SessionType) => void,
    onSessionStart?: () => void
) {
    // Restore persisted timer state if available
    const savedState = getStorageValue<{
        endTime: number | null
        sessionType: SessionType
        completedPomodoros: number
        completedBreaks: number
        remaining: number
        isRunning: boolean
    } | null>('timer-state', null)

    // State
    const remaining = ref(savedState?.remaining ?? config.value.focusDuration * 60)
    const isRunning = ref(false)
    const sessionType = ref<SessionType>(savedState?.sessionType ?? 'focus')
    const completedPomodoros = ref(savedState?.completedPomodoros ?? 0)
    const completedBreaks = ref(savedState?.completedBreaks ?? 0)
    const endTime = ref<number | null>(null)

    let intervalId: number | null = null

    // Persist timer state on changes (lightweight, non-reactive write)
    const persistState = () => {
        setStorageValue('timer-state', {
            endTime: endTime.value,
            sessionType: sessionType.value,
            completedPomodoros: completedPomodoros.value,
            completedBreaks: completedBreaks.value,
            remaining: remaining.value,
            isRunning: isRunning.value,
        })
    }

    // Computed
    const sessionDuration = computed(() => {
        switch (sessionType.value) {
            case 'focus':
                return config.value.focusDuration * 60
            case 'short-break':
                return config.value.shortBreakDuration * 60
            case 'long-break':
                return config.value.longBreakDuration * 60
        }
    })

    const formattedTime = computed(() => {
        const mins = Math.floor(remaining.value / 60)
        const secs = remaining.value % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    })

    const progress = computed(() => {
        return ((sessionDuration.value - remaining.value) / sessionDuration.value) * 100
    })

    // Urgency level based on remaining time
    const urgencyLevel = computed<UrgencyLevel>(() => {
        if (remaining.value <= 30) return 'critical'
        if (remaining.value <= 120) return 'warning'
        return 'normal'
    })

    // Timer tick using timestamp-based calculation
    const tick = () => {
        if (endTime.value) {
            const newRemaining = Math.max(0, Math.round((endTime.value - Date.now()) / 1000))
            remaining.value = newRemaining

            if (newRemaining <= 0) {
                completeSession()
            }
        }
    }

    // Complete current session and transition
    const completeSession = () => {
        stop()

        const completedType = sessionType.value

        if (completedType === 'focus') {
            completedPomodoros.value++

            // Determine next break type
            if (completedPomodoros.value % config.value.pomodorosUntilLongBreak === 0) {
                sessionType.value = 'long-break'
            } else {
                sessionType.value = 'short-break'
            }
        } else {
            completedBreaks.value++
            sessionType.value = 'focus'
        }

        // Reset timer for new session
        remaining.value = sessionDuration.value
        persistState()

        // Notify callback
        onSessionComplete?.(completedType)

        // Auto-start next session if enabled
        const nextIsBreak = sessionType.value !== 'focus'
        const shouldAutoStart = nextIsBreak
            ? config.value.autoStartBreaks
            : config.value.autoStartFocus

        if (shouldAutoStart) {
            // Small delay to allow notifications to fire
            setTimeout(() => {
                onSessionStart?.()
                start()
            }, 500)
        }
    }

    // Controls
    const start = () => {
        if (isRunning.value) return

        endTime.value = Date.now() + remaining.value * 1000
        isRunning.value = true
        intervalId = window.setInterval(tick, 250)
        persistState()
    }

    const pause = () => {
        if (!isRunning.value) return

        // Capture remaining time before clearing
        if (endTime.value) {
            remaining.value = Math.max(0, Math.round((endTime.value - Date.now()) / 1000))
        }

        stop()
    }

    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
        endTime.value = null
        isRunning.value = false
        persistState()
    }

    const reset = () => {
        stop()
        remaining.value = sessionDuration.value
        persistState()
    }

    const skip = () => {
        stop()

        // Transition to next session without counting as complete
        if (sessionType.value === 'focus') {
            // Don't increment completedPomodoros — skipped sessions don't count
            // Use current count to determine next break type
            if ((completedPomodoros.value) % config.value.pomodorosUntilLongBreak === (config.value.pomodorosUntilLongBreak - 1)) {
                sessionType.value = 'long-break'
            } else {
                sessionType.value = 'short-break'
            }
        } else {
            sessionType.value = 'focus'
        }

        remaining.value = sessionDuration.value
        persistState()
    }

    const setSessionType = (type: SessionType) => {
        stop()
        sessionType.value = type
        remaining.value = sessionDuration.value
        persistState()
    }

    // Resume timer if it was running when the page was closed/refreshed
    if (savedState?.isRunning && savedState.endTime) {
        const now = Date.now()
        if (savedState.endTime > now) {
            // Timer still has time left — resume it
            remaining.value = Math.max(0, Math.round((savedState.endTime - now) / 1000))
            endTime.value = savedState.endTime
            isRunning.value = true
            intervalId = window.setInterval(tick, 250)
        } else {
            // Timer expired while page was closed — trigger completion
            remaining.value = 0
            completeSession()
        }
    }

    // Watch for config changes
    watch(config, () => {
        if (!isRunning.value) {
            remaining.value = sessionDuration.value
            persistState()
        }
    }, { deep: true })

    // Cleanup on unmount
    onUnmounted(() => {
        persistState()
        stop()
    })

    return {
        // State
        remaining,
        isRunning,
        sessionType,
        completedPomodoros,
        completedBreaks,
        // Computed
        formattedTime,
        progress,
        sessionDuration,
        urgencyLevel,
        // Methods
        start,
        pause,
        reset,
        skip,
        setSessionType,
    }
}
