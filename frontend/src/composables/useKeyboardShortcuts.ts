import { onMounted, onUnmounted } from 'vue'

export interface KeyboardActions {
    toggleTimer: () => void
    skip: () => void
    reset: () => void
    closeModals: () => void
}

/**
 * Register global keyboard shortcuts for the Pomodoro timer.
 *
 * - Space: start/pause timer
 * - S: skip session
 * - R: reset timer
 * - Escape: close modals
 */
export function useKeyboardShortcuts(
    actions: KeyboardActions,
    _isRunning?: () => boolean
) {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in an input
        if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
        ) {
            return
        }

        switch (e.code) {
            case 'Space':
                e.preventDefault()
                actions.toggleTimer()
                break
            case 'KeyS':
                if (!e.ctrlKey && !e.metaKey) {
                    actions.skip()
                }
                break
            case 'KeyR':
                if (!e.ctrlKey && !e.metaKey) {
                    actions.reset()
                }
                break
            case 'Escape':
                actions.closeModals()
                break
        }
    }

    onMounted(() => {
        document.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyDown)
    })
}
