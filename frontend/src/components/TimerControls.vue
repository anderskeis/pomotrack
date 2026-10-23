<template>
  <div class="timer-controls">
    <button 
      v-if="!isRunning" 
      @click="$emit('start')" 
      class="btn btn-primary btn-large"
    >
      <!-- play (Heroicons mini 20x20) -->
      <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M6.29995 2.84046C5.3011 2.21075 4 2.92857 4 4.10935V15.8905C4 17.0713 5.3011 17.7891 6.29995 17.1594L15.6436 11.2688C16.577 10.6804 16.577 9.31948 15.6436 8.73103L6.29995 2.84046Z" />
      </svg>
      {{ labels?.start ?? 'Start' }}
    </button>
    <button 
      v-else 
      @click="$emit('pause')" 
      class="btn btn-secondary btn-large"
    >
      <!-- pause (Heroicons mini 20x20) -->
      <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M5.75 3C5.33579 3 5 3.33579 5 3.75V16.25C5 16.6642 5.33579 17 5.75 17H7.25C7.66421 17 8 16.6642 8 16.25V3.75C8 3.33579 7.66421 3 7.25 3H5.75Z" />
        <path d="M12.75 3C12.3358 3 12 3.33579 12 3.75V16.25C12 16.6642 12.3358 17 12.75 17H14.25C14.6642 17 15 16.6642 15 16.25V3.75C15 3.33579 14.6642 3 14.25 3H12.75Z" />
      </svg>
      {{ labels?.pause ?? 'Pause' }}
    </button>
    
    <div class="secondary-controls">
      <button @click="$emit('skip')" class="btn btn-ghost" title="Skip to next session">
        <!-- forward (Heroicons mini 20x20) -->
        <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M3.28824 4.81846C2.28891 4.20123 1 4.92008 1 6.09466V13.9051C1 15.0797 2.2889 15.7986 3.28824 15.1813L9.61101 11.2761C9.76598 11.1804 9.89564 11.0635 10 10.9323V13.9051C10 15.0797 11.2889 15.7986 12.2882 15.1813L18.611 11.2761C19.56 10.6899 19.56 9.30986 18.611 8.7237L12.2882 4.81846C11.2889 4.20123 10 4.92008 10 6.09466V9.06745C9.89564 8.93631 9.76598 8.81942 9.61101 8.7237L3.28824 4.81846Z" />
        </svg>
        {{ labels?.skip ?? 'Skip' }}
      </button>
      <button @click="$emit('reset')" class="btn btn-ghost" title="Reset timer">
        <!-- arrow-path (Heroicons mini 20x20) -->
        <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M15.3124 11.4236C14.5262 14.3576 11.5104 16.0988 8.5763 15.3127C7.60728 15.053 6.77024 14.5514 6.11052 13.8904L5.79898 13.5789L8.23221 13.5785C8.64642 13.5784 8.98215 13.2425 8.98208 12.8283C8.982 12.4141 8.64616 12.0784 8.23194 12.0785L3.98851 12.0792C3.78959 12.0792 3.59884 12.1583 3.45821 12.299C3.31758 12.4397 3.2386 12.6305 3.23864 12.8294L3.23954 17.0712C3.23962 17.4854 3.57548 17.8211 3.98969 17.821C4.40391 17.821 4.73962 17.4851 4.73954 17.0709L4.73903 14.6403L5.04888 14.9501C5.88991 15.7926 6.95759 16.4318 8.18808 16.7615C11.9223 17.7621 15.7607 15.5461 16.7613 11.8118C16.8685 11.4117 16.6311 11.0005 16.231 10.8932C15.8309 10.786 15.4196 11.0235 15.3124 11.4236ZM16.5413 7.70119C16.682 7.56051 16.761 7.36971 16.7609 7.17078L16.7603 2.92883C16.7602 2.51462 16.4243 2.17889 16.0101 2.17896C15.5959 2.17902 15.2602 2.51487 15.2603 2.92908L15.2606 5.35995L14.9508 5.05013C14.1098 4.20771 13.0419 3.56827 11.8115 3.23859C8.07728 2.238 4.23892 4.45407 3.23833 8.18834C3.13112 8.58844 3.36856 8.99969 3.76866 9.1069C4.16876 9.2141 4.58001 8.97667 4.68722 8.57657C5.4734 5.6425 8.48925 3.9013 11.4233 4.68748C12.3924 4.94714 13.2294 5.44881 13.8892 6.10979L14.2003 6.4209L11.7683 6.4209C11.3541 6.4209 11.0183 6.75669 11.0183 7.1709C11.0183 7.58512 11.3541 7.9209 11.7683 7.9209H16.0109C16.2099 7.9209 16.4007 7.84187 16.5413 7.70119Z"
          />
        </svg>
        {{ labels?.reset ?? 'Reset' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThemeLabels } from '../composables'

defineProps<{
  isRunning: boolean
  labels?: ThemeLabels['controls']
}>()

defineEmits<{
  start: []
  pause: []
  skip: []
  reset: []
}>()
</script>

<style scoped>
.timer-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-heading, inherit);
  letter-spacing: 0.03em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-icon {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
}

.btn-large {
  padding: 0.7rem 2.25rem;
  font-size: 1.1rem;
  min-width: 160px;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-shadow);
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.btn-secondary:hover {
  background: var(--color-secondary-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-ghost:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.secondary-controls {
  display: flex;
  gap: 0.75rem;
}

/* Compact mode */
.compact-mode .timer-controls {
  gap: 0.5rem;
}

.compact-mode .btn-large {
  padding: 0.5rem 1.75rem;
  font-size: 1rem;
  min-width: 140px;
}
</style>
