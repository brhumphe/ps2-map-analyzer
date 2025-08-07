// composables/useMapDisplaySettings.ts
import { computed, ref, watch } from 'vue';

interface MapDisplaySettings {
  showMarkers: boolean;
  showLatticeLinks: boolean;
  showRegionBorders: boolean;
  showFacilityNames: boolean;
}

// Singleton state
const settings = ref<MapDisplaySettings>({
  showMarkers: true,
  showLatticeLinks: true,
  showRegionBorders: true,
  showFacilityNames: true,
});

// Optional: Persist to localStorage
const STORAGE_KEY = 'map-display-settings';

// Load from localStorage on init
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    Object.assign(settings.value, JSON.parse(stored));
  }
} catch (e) {
  console.warn('Failed to load display settings:', e);
}

// Save to localStorage on change
watch(
  settings,
  (newSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save display settings:', e);
    }
  },
  { deep: true }
);

export function useMapDisplaySettings() {
  return {
    // Expose the entire settings object
    mapDisplaySettings: settings,

    // Or expose individual settings if you prefer
    showMarkers: computed(() => settings.value.showMarkers),
    showLatticeLinks: computed(() => settings.value.showLatticeLinks),
    showRegionBorders: computed(() => settings.value.showRegionBorders),
    showFacilityNames: computed(() => settings.value.showFacilityNames),

    // Utility methods
    toggleMarkers: () => {
      settings.value.showMarkers = !settings.value.showMarkers;
    },

    resetToDefaults: () => {
      settings.value = {
        showMarkers: true,
        showLatticeLinks: true,
        showRegionBorders: true,
        showFacilityNames: true,
      };
    },
  };
}
