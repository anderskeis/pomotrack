import { ref, watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useWakeLock(isRunning: Ref<boolean>, enabled: Ref<boolean>) {
    const wakeLock = ref<WakeLockSentinel | null>(null)
    const isSupported = 'wakeLock' in navigator
    const isActive = ref(false)

    const requestWakeLock = async () => {
        if (!isSupported || !enabled.value) return

        try {
            wakeLock.value = await navigator.wakeLock.request('screen')
            isActive.value = true

            wakeLock.value.addEventListener('release', () => {
                isActive.value = false
                wakeLock.value = null
            })
        } catch (err) {
            // Wake lock request failed (e.g., low battery)
            console.warn('Wake lock request failed:', err)
            isActive.value = false
        }
    }

    const releaseWakeLock = async () => {
        if (wakeLock.value) {
            try {
                await wakeLock.value.release()
            } catch {
                // Already released
            }
            wakeLock.value = null
            isActive.value = false
        }
    }

    // Handle visibility change - reacquire lock when tab becomes visible
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && isRunning.value && enabled.value) {
            await requestWakeLock()
        }
    }

    // Watch running state
    watch(
        [isRunning, enabled],
        async ([running, lockEnabled]) => {
            if (running && lockEnabled) {
                await requestWakeLock()
            } else {
                await releaseWakeLock()
            }
        },
        { immediate: true }
    )

    // Add visibility change listener
    if (isSupported) {
        document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // Cleanup
    onUnmounted(async () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        await releaseWakeLock()
    })

    return {
        isSupported,
        isActive,
        requestWakeLock,
        releaseWakeLock,
    }
}
