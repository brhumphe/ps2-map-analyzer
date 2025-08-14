// composables/useMapDisplaySettings.ts
import { computed, ref, watch } from 'vue';

interface MapDisplaySettings {
  // showMarkers: boolean;
  showLatticeLinks: boolean;
  showRegionBorders: boolean;
  showFacilityNames: boolean;
  showRegionHover: boolean;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // in seconds
}

const defaultSettings: MapDisplaySettings = {
  // showMarkers: true,
  showLatticeLinks: true,
  showRegionBorders: true,
  showFacilityNames: true,
  showRegionHover: false,
  autoRefreshEnabled: true,
  autoRefreshInterval: 10,
};

// Singleton state
const settings = ref<MapDisplaySettings>(defaultSettings);

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
    // showMarkers: computed(() => settings.value.showMarkers),
    showLatticeLinks: computed(() => settings.value.showLatticeLinks),
    showRegionBorders: computed(() => settings.value.showRegionBorders),
    showFacilityNames: computed(() => settings.value.showFacilityNames),
    showRegionHover: computed(() => settings.value.showRegionHover),
    autoRefreshEnabled: computed(() => settings.value.autoRefreshEnabled),
    autoRefreshInterval: computed(() => settings.value.autoRefreshInterval),

    // Utility methods
    // toggleMarkers: () => {
    //   settings.value.showMarkers = !settings.value.showMarkers;
    // },

    toggleAutoRefresh: () => {
      settings.value.autoRefreshEnabled = !settings.value.autoRefreshEnabled;
    },

    setAutoRefreshInterval: (seconds: number) => {
      // Clamp to reasonable range (10 seconds to 10 minutes)
      settings.value.autoRefreshInterval = Math.max(10, Math.min(600, seconds));
    },

    resetToDefaults: () => {
      settings.value = defaultSettings;
    },
  };
}
