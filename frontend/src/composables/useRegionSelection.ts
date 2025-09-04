import { ref, computed } from 'vue';
import type { RegionID } from '@/types/common';

// Singleton state - shared across all component instances
const selectedRegion = ref<RegionID | null>(null);

/**
 * Composable for managing region selection state
 *
 * This composable provides global selection state management for map regions,
 * allowing any component to track which region is currently selected
 * without complex event bubbling.
 *
 * Selection behavior:
 * - Clicking on an active region when no region is selected sets that region as selected
 * - Clicking on an already selected region deselects it
 * - Clicking on the leaflet map (not on a region) deselects the selected region
 *
 * Uses the singleton pattern to ensure all components share the same selection state.
 */
export function useRegionSelection() {
  /**
   * Set the currently selected region
   * @param regionId The region ID being selected, or null to clear selection
   */
  const setSelectedRegion = (regionId: RegionID | null): void => {
    if (import.meta.env.DEV) {
      console.debug('Setting selected region:', regionId);
    }
    selectedRegion.value = regionId;
  };

  /**
   * Clear the selection state
   */
  const clearSelectedRegion = (): void => {
    if (import.meta.env.DEV) {
      console.debug('Clearing selected region');
    }
    selectedRegion.value = null;
  };

  /**
   * Toggle selection state for a region
   * If the region is already selected, it will be deselected
   * If no region is selected or a different region is selected, the new region will be selected
   * @param regionId The region ID to toggle selection for
   */
  const toggleRegionSelection = (regionId: RegionID): void => {
    if (import.meta.env.DEV) {
      console.debug(`Toggling selection for region ${regionId}`);
    }
    if (selectedRegion.value === regionId) {
      // Deselect if clicking on already selected region
      selectedRegion.value = null;
    } else {
      // Select the new region
      selectedRegion.value = regionId;
    }
  };

  /**
   * Handle region click - implements the selection logic
   * @param regionId The region ID that was clicked
   */
  const handleRegionClick = (regionId: RegionID): void => {
    toggleRegionSelection(regionId);
  };

  /**
   * Handle map click (clicking on map background, not on a region)
   * This should deselect any selected region
   */
  const handleMapClick = (): void => {
    clearSelectedRegion();
  };

  /**
   * Check if a specific region is currently selected
   * @param regionId The region ID to check
   * @returns True if the specified region is selected
   */
  const isRegionSelected = computed(() => {
    return (regionId: RegionID) => selectedRegion.value === regionId;
  });

  /**
   * Get the currently selected region ID
   */
  const currentSelectedRegion = computed(() => selectedRegion.value);

  /**
   * Check if any region is currently selected
   */
  const hasSelectedRegion = computed(() => selectedRegion.value !== null);

  return {
    // Reactive state
    currentSelectedRegion,
    hasSelectedRegion,

    // Actions
    setSelectedRegion,
    clearSelectedRegion,
    toggleRegionSelection,
    handleRegionClick,
    handleMapClick,

    // Computed helpers
    isRegionSelected,
  };
}
