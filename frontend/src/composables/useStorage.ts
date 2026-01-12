import { ref, watch, type Ref } from 'vue'

const STORAGE_PREFIX = 'pomotrack-'

/**
 * Create a reactive ref that persists to localStorage.
 * @param key Storage key (will be prefixed with 'pomotrack-')
 * @param defaultValue Default value if nothing stored
 */
export function useStorage<T>(key: string, defaultValue: T): Ref<T> {
    const storageKey = STORAGE_PREFIX + key

    // Read initial value from storage
    const storedValue = localStorage.getItem(storageKey)
    let initialValue: T = defaultValue

    if (storedValue !== null) {
        try {
            initialValue = JSON.parse(storedValue) as T
        } catch {
            // Invalid JSON, use default
            initialValue = defaultValue
        }
    }

    const data = ref<T>(initialValue) as Ref<T>

    // Watch for changes and persist
    watch(
        data,
        (newValue) => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(newValue))
            } catch {
                // Storage full or other error
                console.warn(`Failed to save ${storageKey} to localStorage`)
            }
        },
        { deep: true }
    )

    return data
}

/**
 * Clear all pomotrack data from localStorage
 */
export function clearAllStorage(): void {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key)
        }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))
}

/**
 * Get a value from localStorage without reactivity
 */
export function getStorageValue<T>(key: string, defaultValue: T): T {
    const storageKey = STORAGE_PREFIX + key
    const storedValue = localStorage.getItem(storageKey)

    if (storedValue === null) {
        return defaultValue
    }

    try {
        return JSON.parse(storedValue) as T
    } catch {
        return defaultValue
    }
}

/**
 * Set a value in localStorage without reactivity
 */
export function setStorageValue<T>(key: string, value: T): void {
    const storageKey = STORAGE_PREFIX + key
    try {
        localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
        console.warn(`Failed to save ${storageKey} to localStorage`)
    }
}
