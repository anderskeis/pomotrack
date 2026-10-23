<template>
  <span class="theme-svg-icon" :class="[`theme-${themeId}`, `slot-${slot}`]" aria-hidden="true">
    <!-- ==================== WARHAMMER 40K ==================== -->
    <template v-if="themeId === 'warhammer40k'">
      <!-- Imperial Aquila (Double-Headed Eagle) -->
      <svg v-if="slot === 'logo'" viewBox="0 0 32 24" fill="currentColor">
        <path d="M16 7L12 3H8L10 6L13 8L12 11L2 5L4 9L1 9L5 12L2 13L7 15L4 17L10 17L13 19L12 22H16H20L19 19L22 17L28 17L25 15L30 13L27 12L31 9L28 9L30 5L20 11L19 8L22 6L24 3H20L16 7Z" />
        <circle cx="16" cy="13" r="2.2" fill="var(--bg-primary)" />
      </svg>

      <!-- Power Sword / Crusade Blade -->
      <svg v-else-if="slot === 'focus'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.5 2.5L13 9L10.5 6.5L9 8L11.5 10.5L4 18V20H6L13.5 12.5L16 15L17.5 13.5L15 11L21.5 4.5L19.5 2.5ZM6.5 17.5L5.5 18.5H4.5V17.5L5.5 16.5L6.5 17.5Z" />
        <path d="M3 19L5 21L2 22L3 19Z" />
      </svg>

      <!-- Adeptus Mechanicus Cog-Gear -->
      <svg v-else-if="slot === 'shortBreak'" viewBox="0 0 24 24" fill="currentColor">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 2H13.5L14 4.2C14.8 4.5 15.5 4.9 16.1 5.4L18.2 4.5L20.3 6.6L19.4 8.7C19.9 9.3 20.3 10 20.6 10.8L22.8 11.3V14.3L20.6 14.8C20.3 15.6 19.9 16.3 19.4 16.9L20.3 19L18.2 21.1L16.1 20.2C15.5 20.7 14.8 21.1 14 21.4L13.5 23.6H10.5L10 21.4C9.2 21.1 8.5 20.7 7.9 20.2L5.8 21.1L3.7 19L4.6 16.9C4.1 16.3 3.7 15.6 3.4 14.8L1.2 14.3V11.3L3.4 10.8C3.7 10 4.1 9.3 4.6 8.7L3.7 6.6L5.8 4.5L7.9 5.4C8.5 4.9 9.2 4.5 10 4.2L10.5 2ZM12 8C9.5 8 7.5 10 7.5 12.5C7.5 14.2 8.4 15.7 9.8 16.4V18.5H11V17H13V18.5H14.2V16.4C15.6 15.7 16.5 14.2 16.5 12.5C16.5 10 14.5 8 12 8ZM10.2 12.5C10.2 11.8 10.8 11.2 11.5 11.2C12.2 11.2 12.8 11.8 12.8 12.5C12.8 13.2 12.2 13.8 11.5 13.8C10.8 13.8 10.2 13.2 10.2 12.5Z" />
      </svg>

      <!-- Imperial Crux / Shield -->
      <svg v-else-if="slot === 'longBreak'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2ZM13 7V11H17V13H13V18H11V13H7V11H11V7H13Z" />
      </svg>

      <!-- Wax Purity Seal -->
      <svg v-else viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="9" r="6" />
        <path d="M9 14L7 22L10.5 20.5L11.5 15H9ZM15 14L17 22L13.5 20.5L12.5 15H15Z" />
      </svg>
    </template>

    <!-- ==================== STAR WARS ==================== -->
    <template v-else-if="themeId === 'starwars'">
      <!-- Jedi / Alliance Starbird Crest -->
      <svg v-if="slot === 'logo'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L13.8 8.5L16.5 6.5L15.2 11.2C16.8 10.2 18.2 8.2 18.2 5.5C18.2 3.8 17.5 2.5 17.5 2.5C20.5 4.8 22 8.5 22 12.2C22 17.6 17.5 22 12 22C6.5 22 2 17.6 2 12.2C2 8.5 3.5 4.8 6.5 2.5C6.5 2.5 5.8 3.8 5.8 5.5C5.8 8.2 7.2 10.2 8.8 11.2L7.5 6.5L10.2 8.5L12 2Z" />
      </svg>

      <!-- Ignited Kyber Lightsaber -->
      <svg v-else-if="slot === 'focus'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.8 2.8C20.4 2.2 21.3 2.2 21.9 2.8C22.5 3.4 22.5 4.3 21.9 4.9L10.6 16.2L8.5 14.1L19.8 2.8Z" />
        <path d="M7.8 14.8L9.9 16.9L5.6 21.2C5 21.8 4.1 21.8 3.5 21.2C2.9 20.6 2.9 19.7 3.5 19.1L7.8 14.8Z" opacity="0.75" />
        <rect x="6.8" y="13.8" width="4.2" height="1.6" transform="rotate(45 6.8 13.8)" />
      </svg>

      <!-- Astromech / Bacta Dome -->
      <svg v-else-if="slot === 'shortBreak'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C7.6 3 4 6.6 4 11H20C20 6.6 16.4 3 12 3ZM12 6.5C13.1 6.5 14 7.4 14 8.5C14 9.6 13.1 10.5 12 10.5C10.9 10.5 10 9.6 10 8.5C10 7.4 10.9 6.5 12 6.5ZM16.5 9C17.1 9 17.5 9.4 17.5 10C17.5 10.6 17.1 11 16.5 11C15.9 11 15.5 10.6 15.5 10C15.5 9.4 15.9 9 16.5 9Z" />
        <path d="M4 12.5H20V19.5C20 20.3 19.3 21 18.5 21H5.5C4.7 21 4 20.3 4 19.5V12.5ZM8 14.5V18.5H10V14.5H8ZM12 14.5V16.5H16V14.5H12Z" />
      </svg>

      <!-- Hyperspace Starburst -->
      <svg v-else-if="slot === 'longBreak'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L14.2 9.8L23 12L14.2 14.2L12 23L9.8 14.2L1 12L9.8 9.8L12 1Z" />
        <path d="M5 5L9.5 9.5M19 5L14.5 9.5M5 19L9.5 14.5M19 19L14.5 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>

      <!-- Targeting Computer Reticle -->
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke-linecap="round" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    </template>

    <!-- ==================== DEFAULT ==================== -->
    <template v-else>
      <!-- Tomato / Timer Emblem -->
      <svg v-if="slot === 'logo' || slot === 'focus'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 5C10.8 5 9.8 4.2 9.4 3.1C8.3 3.9 7.8 5.1 8 6.2C6.8 5.4 5.3 5.5 4.3 6.3C5.6 6.8 6.7 7.6 7.4 8.5C4.8 9.7 3 12.2 3 15.2C3 19.5 7 22 12 22C17 22 21 19.5 21 15.2C21 12.2 19.2 9.7 16.6 8.5C17.3 7.6 18.4 6.8 19.7 6.3C18.7 5.5 17.2 5.4 16 6.2C16.2 5.1 15.7 3.9 14.6 3.1C14.2 4.2 13.2 5 12 5Z" />
      </svg>

      <!-- Coffee Cup -->
      <svg v-else-if="slot === 'shortBreak'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 7H17V14C17 16.8 14.8 19 12 19H9C6.2 19 4 16.8 4 14V7ZM19 8H20C21.7 8 23 9.3 23 11C23 12.7 21.7 14 20 14H19V8ZM3 20H18V22H3V20Z" />
      </svg>

      <!-- Sun / Long Break -->
      <svg v-else-if="slot === 'longBreak'" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.9 4.9L7.1 7.1M16.9 16.9L19.1 19.1M19.1 4.9L16.9 7.1M7.1 16.9L4.9 19.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>

      <!-- Target / Active -->
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    </template>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  themeId: string
  slot: 'logo' | 'focus' | 'shortBreak' | 'longBreak' | 'active'
  fallback?: string
}>()
</script>

<style scoped>
.theme-svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.theme-svg-icon svg {
  width: 1.15em;
  height: 1.15em;
  display: block;
}

.slot-logo svg {
  width: 1.35em;
  height: 1.35em;
}
</style>
