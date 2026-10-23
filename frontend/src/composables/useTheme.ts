import { ref, computed, watch, onMounted } from 'vue'
import themesData from '../themes/themes.json'

export type Theme = 'light' | 'dark'
export type ThemePresetId = string

export interface ThemeIcons {
    logo: string
    focus: string
    shortBreak: string
    longBreak: string
}

export interface ThemeLabels {
    appTitle: string
    appSubtitle: string
    modes: {
        focus: string
        shortBreak: string
        longBreak: string
    }
    controls: {
        start: string
        pause: string
        skip: string
        reset: string
        spaceHintBefore: string
        spaceHintAfter: string
    }
    sessionLabel: {
        title: string
        placeholder: string
        presets: string[]
    }
    kanban: {
        title: string
        addPlaceholder: string
        todo: string
        inProgress: string
        done: string
        activeBadge: string
        emptyTodo: string
        emptyInProgress: string
        emptyDone: string
    }
    stats: {
        dailyProgressTitle: string
        goalReachedText: string
        sessionStatsTitle: string
        pomodorosLabel: string
        breaksLabel: string
        focusTimeLabel: string
        viewSummaryBtn: string
    }
    goalToast: {
        title: string
        message: string
    }
}

export interface ThemePreset {
    id: ThemePresetId
    name: string
    icon: string
    description: string
    tagline: string
    backgroundImage: string
    fonts: Record<string, string>
    icons: ThemeIcons
    labels: ThemeLabels
    colors: {
        dark: Record<string, string>
        light: Record<string, string>
    }
}

const STORAGE_KEY = 'pomotrack-theme'
const PRESET_STORAGE_KEY = 'pomotrack-theme-preset'

const availableThemes: ThemePreset[] = themesData as ThemePreset[]
const defaultPreset = availableThemes[0]!

export function useTheme() {
    const theme = ref<Theme>('dark')
    const themePresetId = ref<ThemePresetId>(defaultPreset.id)

    const activeThemePreset = computed<ThemePreset>(() => {
        return (
            availableThemes.find((t) => t.id === themePresetId.value) ??
            defaultPreset
        )
    })

    const applyTheme = (mode: Theme, preset: ThemePreset) => {
        if (typeof document === 'undefined') return
        const root = document.documentElement
        root.setAttribute('data-theme', mode)
        root.setAttribute('data-theme-preset', preset.id)
        root.classList.remove('light', 'dark')
        root.classList.add(mode)

        const palette = preset.colors[mode] ?? preset.colors.dark
        for (const [cssVar, value] of Object.entries(palette)) {
            root.style.setProperty(cssVar, value)
        }
        if (preset.fonts) {
            for (const [fontVar, value] of Object.entries(preset.fonts)) {
                root.style.setProperty(fontVar, value)
            }
        }
        root.style.setProperty(
            '--theme-bg-image',
            preset.backgroundImage ? `url("${preset.backgroundImage}")` : 'none'
        )
    }

    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }

    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme
    }

    const setThemePreset = (presetId: ThemePresetId) => {
        if (availableThemes.some((t) => t.id === presetId)) {
            themePresetId.value = presetId
        }
    }

    // Initialize theme & preset from localStorage or system preference
    onMounted(() => {
        const storedMode = localStorage.getItem(STORAGE_KEY) as Theme | null
        const storedPreset = localStorage.getItem(PRESET_STORAGE_KEY)

        if (storedMode && (storedMode === 'light' || storedMode === 'dark')) {
            theme.value = storedMode
        } else if (typeof window !== 'undefined' && window.matchMedia) {
            theme.value = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
        } else {
            theme.value = 'dark'
        }

        if (storedPreset && availableThemes.some((t) => t.id === storedPreset)) {
            themePresetId.value = storedPreset
        }

        applyTheme(theme.value, activeThemePreset.value)
    })

    // Watch for color mode or preset changes
    watch([theme, themePresetId], ([newMode, newPresetId]) => {
        localStorage.setItem(STORAGE_KEY, newMode)
        localStorage.setItem(PRESET_STORAGE_KEY, newPresetId)
        applyTheme(newMode, activeThemePreset.value)
    })

    return {
        theme,
        themePresetId,
        activeThemePreset,
        availableThemes,
        toggleTheme,
        setTheme,
        setThemePreset,
    }
}
