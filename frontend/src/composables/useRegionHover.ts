import { ref, computed } from 'vue';
import type { RegionID } from '@/types/common';

// Singleton state - shared across all component instances
const hoveredRegion = ref<RegionID | null>(null);
let hoverClearTimeout: NodeJS.Timeout | null = null;

/**
 * Composable for managing region hover state with Vue reactivity
 *
 * This composable provides global hover state management for map regions,
 * allowing any component to track which region is currently being hovered
 * without complex event bubbling.
 *
 * Uses singleton pattern to ensure all components share the same hover state.
 */
export function useRegionHover() {
  /**
   * Set the currently hovered region
   * @param regionId The region ID being hovered, or null to clear hover
   */
  const setHoveredRegion = (regionId: RegionID | null): void => {
    // Cancel any pending clear operation
    if (hoverClearTimeout) {
      clearTimeout(hoverClearTimeout);
      hoverClearTimeout = null;
    }
    hoveredRegion.value = regionId;
  };

  /**
   * Clear the hover state with a small delay to handle brief movements over links
   */
  const clearHoveredRegion = (): void => {
    // Cancel any existing timeout
    if (hoverClearTimeout) {
      clearTimeout(hoverClearTimeout);
    }

    // Set a small delay before clearing to handle brief cursor movements over links
    hoverClearTimeout = setTimeout(() => {
      hoveredRegion.value = null;
      hoverClearTimeout = null;
    }, 200); // Delay in milliseconds
  };

  /**
   * Check if a specific region is currently hovered
   * @param regionId The region ID to check
   * @returns True if the specified region is hovered
   */
  const isRegionHovered = computed(() => {
    return (regionId: RegionID) => hoveredRegion.value === regionId;
  });

  /**
   * Get the currently hovered region ID
   */
  const currentHoveredRegion = computed(() => hoveredRegion.value);

  /**
   * Check if any region is currently hovered
   */
  const hasHoveredRegion = computed(() => hoveredRegion.value !== null);

  return {
    // Reactive state
    currentHoveredRegion,
    hasHoveredRegion,

    // Actions
    setHoveredRegion,
    clearHoveredRegion,

    // Computed helpers
    isRegionHovered,
  };
}
