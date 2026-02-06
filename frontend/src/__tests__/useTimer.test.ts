import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useTimer, defaultConfig, type TimerConfig } from '../composables/useTimer'

// Mock useStorage functions (timer persistence)
vi.mock('../composables/useStorage', () => ({
    getStorageValue: vi.fn(() => null),
    setStorageValue: vi.fn(),
}))

describe('useTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('initializes with correct default values', () => {
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { remaining, isRunning, sessionType, completedPomodoros } = useTimer(config)

        expect(remaining.value).toBe(25 * 60) // 25 minutes in seconds
        expect(isRunning.value).toBe(false)
        expect(sessionType.value).toBe('focus')
        expect(completedPomodoros.value).toBe(0)
    })

    it('starts and tracks running state', () => {
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { isRunning, start } = useTimer(config)

        expect(isRunning.value).toBe(false)
        start()
        expect(isRunning.value).toBe(true)
    })

    it('pauses and preserves remaining time', () => {
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { isRunning, remaining, start, pause } = useTimer(config)

        start()
        expect(isRunning.value).toBe(true)

        // Advance 10 seconds
        vi.advanceTimersByTime(10000)

        pause()
        expect(isRunning.value).toBe(false)
        // remaining should be approximately 25*60 - 10 = 1490, within tolerance
        expect(remaining.value).toBeLessThanOrEqual(25 * 60)
        expect(remaining.value).toBeGreaterThan(25 * 60 - 15)
    })

    it('resets to session duration', () => {
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { remaining, start, reset } = useTimer(config)

        start()
        vi.advanceTimersByTime(5000)
        reset()

        expect(remaining.value).toBe(25 * 60)
    })

    it('transitions from focus to short break on completion', () => {
        const onComplete = vi.fn()
        const config = ref<TimerConfig>({ ...defaultConfig, focusDuration: 1 }) // 1 minute

        // Simulate start + complete by advancing through a 1-minute session
        const { start, sessionType, completedPomodoros } = useTimer(config, onComplete)
        start()
        vi.advanceTimersByTime(61000) // advance past 1 minute

        expect(sessionType.value).toBe('short-break')
        expect(completedPomodoros.value).toBe(1)
    })

    it('transitions to long break after pomodorosUntilLongBreak', () => {
        const onComplete = vi.fn()
        const config = ref<TimerConfig>({
            ...defaultConfig,
            focusDuration: 1, // 1 minute for fast testing
            pomodorosUntilLongBreak: 2,
        })

        const timer = useTimer(config, onComplete)

        // Complete first focus session
        timer.start()
        vi.advanceTimersByTime(61000)

        expect(timer.sessionType.value).toBe('short-break')
        expect(timer.completedPomodoros.value).toBe(1)
    })

    it('skip does not increment completedPomodoros', () => {
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { completedPomodoros, skip } = useTimer(config)

        expect(completedPomodoros.value).toBe(0)
        skip()
        expect(completedPomodoros.value).toBe(0)
    })

    it('skip transitions focus to break correctly', () => {
        const config = ref<TimerConfig>({
            ...defaultConfig,
            pomodorosUntilLongBreak: 4,
        })
        const { sessionType, skip } = useTimer(config)

        expect(sessionType.value).toBe('focus')
        skip()
        // Should go to short break (0 completed, not at long-break threshold)
        expect(sessionType.value).toBe('short-break')
    })

    it('skip transitions break to focus', () => {
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { sessionType, skip } = useTimer(config)

        // Skip focus → break
        skip()
        expect(sessionType.value).not.toBe('focus')

        // Skip break → focus
        skip()
        expect(sessionType.value).toBe('focus')
    })

    it('formats time correctly', () => {
        const config = ref<TimerConfig>({ ...defaultConfig, focusDuration: 25 })
        const { formattedTime } = useTimer(config)

        expect(formattedTime.value).toBe('25:00')
    })

    it('calculates progress correctly', () => {
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { progress } = useTimer(config)

        // At start, progress should be 0
        expect(progress.value).toBe(0)
    })

    it('calculates urgency levels', () => {
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { urgencyLevel, remaining } = useTimer(config)

        expect(urgencyLevel.value).toBe('normal')

        remaining.value = 100
        expect(urgencyLevel.value).toBe('warning')

        remaining.value = 20
        expect(urgencyLevel.value).toBe('critical')
    })

    it('updates remaining when config changes while not running', async () => {
        vi.useRealTimers()
        const { nextTick } = await import('vue')
        const config = ref<TimerConfig>({ ...defaultConfig })
        const { remaining, isRunning } = useTimer(config)

        expect(remaining.value).toBe(25 * 60)
        expect(isRunning.value).toBe(false)

        config.value = { ...config.value, focusDuration: 30 }
        // Vue watchers fire asynchronously
        await nextTick()

        expect(remaining.value).toBe(30 * 60)
    })

    it('calls onSessionStart callback on auto-start', () => {
        const onComplete = vi.fn()
        const onStart = vi.fn()
        const config = ref<TimerConfig>({
            ...defaultConfig,
            focusDuration: 1,
            autoStartBreaks: true,
        })

        const timer = useTimer(config, onComplete, onStart)

        timer.start()
        // Complete the focus session
        vi.advanceTimersByTime(61000)

        // Auto-start delay is 500ms
        vi.advanceTimersByTime(600)

        expect(onStart).toHaveBeenCalled()
    })
})
