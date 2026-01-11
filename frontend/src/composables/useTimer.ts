import { ref, computed, onUnmounted, watch } from 'vue'

export type SessionType = 'focus' | 'short-break' | 'long-break'

export interface TimerConfig {
    focusDuration: number // minutes
    shortBreakDuration: number // minutes
    longBreakDuration: number // minutes
    pomodorosUntilLongBreak: number
}

export interface TimerState {
    remaining: number // seconds
    isRunning: boolean
    sessionType: SessionType
    completedPomodoros: number
    completedBreaks: number
}

const defaultConfig: TimerConfig = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosUntilLongBreak: 4,
}

export function useTimer(
    config = ref<TimerConfig>(defaultConfig),
    onSessionComplete?: (sessionType: SessionType) => void
) {
    // State
    const remaining = ref(config.value.focusDuration * 60)
    const isRunning = ref(false)
    const sessionType = ref<SessionType>('focus')
    const completedPomodoros = ref(0)
    const completedBreaks = ref(0)
    const endTime = ref<number | null>(null)

    let intervalId: number | null = null

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

        // Notify callback
        onSessionComplete?.(completedType)
    }

    // Controls
    const start = () => {
        if (isRunning.value) return

        endTime.value = Date.now() + remaining.value * 1000
        isRunning.value = true
        intervalId = window.setInterval(tick, 250)
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
    }

    const reset = () => {
        stop()
        remaining.value = sessionDuration.value
    }

    const skip = () => {
        stop()

        // Transition to next session without counting as complete
        if (sessionType.value === 'focus') {
            if ((completedPomodoros.value + 1) % config.value.pomodorosUntilLongBreak === 0) {
                sessionType.value = 'long-break'
            } else {
                sessionType.value = 'short-break'
            }
        } else {
            sessionType.value = 'focus'
        }

        remaining.value = sessionDuration.value
    }

    const setSessionType = (type: SessionType) => {
        stop()
        sessionType.value = type
        remaining.value = sessionDuration.value
    }

    // Watch for config changes
    watch(config, () => {
        if (!isRunning.value) {
            remaining.value = sessionDuration.value
        }
    }, { deep: true })

    // Cleanup on unmount
    onUnmounted(() => {
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
        // Methods
        start,
        pause,
        reset,
        skip,
        setSessionType,
    }
}
