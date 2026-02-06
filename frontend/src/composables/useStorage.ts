import { ref, watch, type Ref } from 'vue'

const STORAGE_PREFIX = 'pomotrack-'

// Singleton cache: ensures the same key always returns the same reactive ref
const refCache = new Map<string, Ref<unknown>>()

// Debounce timers per key
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
const DEBOUNCE_MS = 300

/**
 * Create a reactive ref that persists to localStorage.
 * Uses a singleton cache so the same key always returns the same ref instance.
 * Writes are debounced to avoid excessive serialization.
 *
 * @param key Storage key (will be prefixed with 'pomotrack-')
 * @param defaultValue Default value if nothing stored
 * @param options Optional schema versioning config
 */
export function useStorage<T>(
    key: string,
    defaultValue: T,
    options?: {
        version?: number
        migrate?: (oldData: unknown, oldVersion: number) => T
    }
): Ref<T> {
    const storageKey = STORAGE_PREFIX + key

    // Return cached ref if it already exists (singleton)
    if (refCache.has(storageKey)) {
        return refCache.get(storageKey) as Ref<T>
    }

    // Read initial value from storage
    let initialValue: T = defaultValue

    const raw = localStorage.getItem(storageKey)
    if (raw !== null) {
        try {
            const parsed = JSON.parse(raw)

            if (options?.version !== undefined) {
                // Schema-versioned storage: { _v: number, data: T }
                if (parsed && typeof parsed === 'object' && '_v' in parsed) {
                    if (parsed._v === options.version) {
                        initialValue = parsed.data as T
                    } else if (options.migrate) {
                        initialValue = options.migrate(parsed.data, parsed._v)
                    } else {
                        // Version mismatch with no migration — use default
                        initialValue = defaultValue
                    }
                } else {
                    // Legacy unversioned data — treat as version 0
                    if (options.migrate) {
                        initialValue = options.migrate(parsed, 0)
                    } else {
                        initialValue = parsed as T
                    }
                }
            } else {
                initialValue = parsed as T
            }
        } catch {
            // Invalid JSON, use default
            initialValue = defaultValue
        }
    }

    const data = ref<T>(initialValue) as Ref<T>

    // Watch for changes and persist (debounced)
    watch(
        data,
        (newValue) => {
            // Clear any pending write for this key
            const existing = debounceTimers.get(storageKey)
            if (existing) clearTimeout(existing)

            debounceTimers.set(
                storageKey,
                setTimeout(() => {
                    try {
                        const toStore = options?.version !== undefined
                            ? JSON.stringify({ _v: options.version, data: newValue })
                            : JSON.stringify(newValue)
                        localStorage.setItem(storageKey, toStore)
                    } catch (e) {
                        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                            console.error(`[Pomotrack] Storage quota exceeded for ${key}. Consider clearing old data.`)
                        } else {
                            console.warn(`Failed to save ${storageKey} to localStorage`)
                        }
                    }
                    debounceTimers.delete(storageKey)
                }, DEBOUNCE_MS)
            )
        },
        { deep: true }
    )

    // Cache the ref
    refCache.set(storageKey, data as Ref<unknown>)

    return data
}

/**
 * Clear all pomotrack data from localStorage and reset cached refs
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

    // Clear the singleton cache so refs get re-created with defaults
    refCache.clear()
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

/**
 * Export all pomotrack data as a JSON object (for backup)
 */
export function exportAllData(): Record<string, unknown> {
    const data: Record<string, unknown> = {}

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_PREFIX)) {
            try {
                data[key] = JSON.parse(localStorage.getItem(key)!)
            } catch {
                data[key] = localStorage.getItem(key)
            }
        }
    }

    return data
}

/**
 * Import pomotrack data from a JSON object (restore backup)
 */
export function importAllData(data: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(STORAGE_PREFIX)) {
            try {
                localStorage.setItem(key, JSON.stringify(value))
            } catch {
                console.warn(`Failed to import ${key}`)
            }
        }
    }

    // Clear cache so refs reload from fresh localStorage values
    refCache.clear()
}
