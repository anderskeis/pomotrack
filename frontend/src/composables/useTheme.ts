import { ref, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'pomotrack-theme'

export function useTheme() {
    const theme = ref<Theme>('dark')

    const applyTheme = (newTheme: Theme) => {
        document.documentElement.setAttribute('data-theme', newTheme)
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newTheme)
    }

    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }

    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme
    }

    // Initialize theme from localStorage or system preference
    onMounted(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null

        if (stored && (stored === 'light' || stored === 'dark')) {
            theme.value = stored
        } else {
            // Default to dark mode for this dashboard-style app
            theme.value = 'dark'
        }

        applyTheme(theme.value)
    })

    // Watch for theme changes
    watch(theme, (newTheme) => {
        localStorage.setItem(STORAGE_KEY, newTheme)
        applyTheme(newTheme)
    })

    return {
        theme,
        toggleTheme,
        setTheme,
    }
}
