import { ref, onMounted } from 'vue'

// Generate a bell-like tone using Web Audio API as fallback
function createSynthesizedBell(): () => void {
    return () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const duration = 0.6

            // Create oscillators for bell harmonics
            const frequencies = [880, 1760, 2640]
            const gains = [0.4, 0.25, 0.1]

            frequencies.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.type = 'sine'
                oscillator.frequency.value = freq

                // Decay envelope
                gainNode.gain.setValueAtTime(gains[i], audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + duration)
            })
        } catch {
            console.warn('Web Audio API not supported')
        }
    }
}

export function useAudio(src: string = '/sounds/bell.mp3') {
    const audio = ref<HTMLAudioElement | null>(null)
    const isLoaded = ref(false)
    const volume = ref(0.7)
    const useFallback = ref(false)

    let playFallback: (() => void) | null = null

    onMounted(() => {
        // Try to load the audio file
        audio.value = new Audio(src)
        audio.value.preload = 'auto'
        audio.value.volume = volume.value

        audio.value.addEventListener('canplaythrough', () => {
            isLoaded.value = true
        })

        audio.value.addEventListener('error', () => {
            // Fall back to synthesized sound
            useFallback.value = true
            playFallback = createSynthesizedBell()
            isLoaded.value = true
        })

        // Also prepare fallback
        playFallback = createSynthesizedBell()
    })

    const play = async () => {
        if (useFallback.value && playFallback) {
            playFallback()
            return
        }

        if (!audio.value) return

        try {
            audio.value.currentTime = 0
            audio.value.volume = volume.value
            await audio.value.play()
        } catch {
            // Autoplay blocked or file not found - use fallback
            if (playFallback) {
                playFallback()
            }
        }
    }

    const setVolume = (newVolume: number) => {
        volume.value = Math.max(0, Math.min(1, newVolume))
        if (audio.value) {
            audio.value.volume = volume.value
        }
    }

    const preload = () => {
        if (audio.value) {
            audio.value.load()
        }
    }

    return {
        play,
        setVolume,
        preload,
        volume,
        isLoaded,
    }
}
