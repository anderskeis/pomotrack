import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'

// We need to reset the module between tests to clear the singleton cache
let useStorage: typeof import('../composables/useStorage').useStorage
let clearAllStorage: typeof import('../composables/useStorage').clearAllStorage
let exportAllData: typeof import('../composables/useStorage').exportAllData

// Minimal localStorage mock
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value },
        removeItem: (key: string) => { delete store[key] },
        clear: () => { store = {} },
        get length() { return Object.keys(store).length },
        key: (index: number) => Object.keys(store)[index] ?? null,
    }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('useStorage', () => {
    beforeEach(async () => {
        localStorageMock.clear()
        // Re-import module to reset singleton cache
        vi.resetModules()
        const mod = await import('../composables/useStorage')
        useStorage = mod.useStorage
        clearAllStorage = mod.clearAllStorage
        exportAllData = mod.exportAllData
    })

    it('returns default value when nothing stored', () => {
        const val = useStorage('test-key', 42)
        expect(val.value).toBe(42)
    })

    it('reads existing value from localStorage', () => {
        localStorageMock.setItem('pomotrack-test-key', JSON.stringify(99))
        const val = useStorage('test-key', 42)
        expect(val.value).toBe(99)
    })

    it('falls back to default on invalid JSON', () => {
        localStorageMock.setItem('pomotrack-test-key', 'not-json')
        const val = useStorage('test-key', 42)
        expect(val.value).toBe(42)
    })

    it('persists changes to localStorage (debounced)', async () => {
        vi.useFakeTimers()
        const val = useStorage('test-key', 'hello')
        val.value = 'world'

        // Trigger watcher
        await nextTick()

        // Debounce: should not be written yet (or still has old/initial value)
        const beforeDebounce = localStorageMock.getItem('pomotrack-test-key')
        // Before debounce fires, it should either be null (never written) or the old value
        expect(beforeDebounce).not.toBe(JSON.stringify('world'))

        // Advance past debounce (300ms)
        vi.advanceTimersByTime(350)
        vi.useRealTimers()

        expect(localStorageMock.getItem('pomotrack-test-key')).toBe(JSON.stringify('world'))
    })

    it('returns the same ref for the same key (singleton)', () => {
        const val1 = useStorage('shared-key', 'a')
        const val2 = useStorage('shared-key', 'b')
        expect(val1).toBe(val2)
        expect(val1.value).toBe('a') // first call wins
    })

    it('persists complex objects', async () => {
        vi.useFakeTimers()
        const val = useStorage('obj-key', { count: 0, name: 'test' })
        val.value = { count: 5, name: 'updated' }
        await nextTick()
        vi.advanceTimersByTime(350)
        vi.useRealTimers()

        const stored = JSON.parse(localStorageMock.getItem('pomotrack-obj-key')!)
        expect(stored).toEqual({ count: 5, name: 'updated' })
    })

    it('clearAllStorage removes all pomotrack keys', () => {
        localStorageMock.setItem('pomotrack-a', '1')
        localStorageMock.setItem('pomotrack-b', '2')
        localStorageMock.setItem('other-key', '3')

        clearAllStorage()

        expect(localStorageMock.getItem('pomotrack-a')).toBeNull()
        expect(localStorageMock.getItem('pomotrack-b')).toBeNull()
        expect(localStorageMock.getItem('other-key')).toBe('3')
    })

    it('supports schema versioning', () => {
        // Store versioned data
        localStorageMock.setItem(
            'pomotrack-versioned',
            JSON.stringify({ _v: 1, data: { name: 'old' } })
        )

        const val = useStorage('versioned', { name: 'default', extra: true }, {
            version: 1,
        })

        expect(val.value).toEqual({ name: 'old' })
    })

    it('runs migration when version changes', () => {
        localStorageMock.setItem(
            'pomotrack-migrated',
            JSON.stringify({ _v: 1, data: { name: 'old' } })
        )

        const val = useStorage(
            'migrated',
            { name: 'default', extra: true },
            {
                version: 2,
                migrate: (oldData: any, oldVersion: number) => {
                    expect(oldVersion).toBe(1)
                    return { ...oldData, extra: true }
                },
            }
        )

        expect(val.value).toEqual({ name: 'old', extra: true })
    })

    it('migrates legacy unversioned data', () => {
        // Old-format data (no _v wrapper)
        localStorageMock.setItem('pomotrack-legacy', JSON.stringify({ count: 5 }))

        const val = useStorage(
            'legacy',
            { count: 0, version: 'v2' },
            {
                version: 1,
                migrate: (oldData: any, oldVersion: number) => {
                    expect(oldVersion).toBe(0) // unversioned = version 0
                    return { ...oldData, version: 'v2' }
                },
            }
        )

        expect(val.value).toEqual({ count: 5, version: 'v2' })
    })

    it('exportAllData collects all pomotrack keys', () => {
        localStorageMock.setItem('pomotrack-x', JSON.stringify('hello'))
        localStorageMock.setItem('pomotrack-y', JSON.stringify(42))
        localStorageMock.setItem('other', 'ignored')

        const data = exportAllData()
        expect(data['pomotrack-x']).toBe('hello')
        expect(data['pomotrack-y']).toBe(42)
        expect(data['other']).toBeUndefined()
    })
})
