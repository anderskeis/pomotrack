import { ref } from 'vue'

export type NotificationPermission = 'default' | 'granted' | 'denied'

export function useNotifications() {
    const permission = ref<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'denied'
    )
    const isSupported = typeof Notification !== 'undefined'

    const requestPermission = async (): Promise<NotificationPermission> => {
        if (!isSupported) {
            return 'denied'
        }

        try {
            const result = await Notification.requestPermission()
            permission.value = result
            return result
        } catch {
            return 'denied'
        }
    }

    const notify = (title: string, options?: NotificationOptions) => {
        if (!isSupported || permission.value !== 'granted') {
            return null
        }

        try {
            return new Notification(title, {
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: 'pomotrack',
                requireInteraction: true,
                ...options,
            })
        } catch {
            return null
        }
    }

    const notifySessionComplete = (sessionType: 'focus' | 'short-break' | 'long-break') => {
        const messages = {
            'focus': {
                title: '🍅 Focus session complete!',
                body: 'Great work! Time for a break.',
            },
            'short-break': {
                title: '☕ Break is over!',
                body: 'Ready to focus again?',
            },
            'long-break': {
                title: '🎉 Long break is over!',
                body: 'Refreshed and ready to go!',
            },
        }

        const { title, body } = messages[sessionType]
        return notify(title, { body })
    }

    const notifyGoalReached = (goal: number) => {
        return notify('🎉 Daily goal reached!', {
            body: `Congratulations! You've completed your daily goal of ${goal} pomodoros today.`,
        })
    }

    return {
        permission,
        isSupported,
        requestPermission,
        notify,
        notifySessionComplete,
        notifyGoalReached,
    }
}
