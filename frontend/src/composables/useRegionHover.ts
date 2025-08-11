import { ref, computed } from 'vue';
import type { RegionID } from '@/types/common';

// Singleton state - shared across all component instances
const hoveredRegion = ref<RegionID | null>(null);

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
    hoveredRegion.value = regionId;
  };

  /**
   * Clear the hover state (convenience method)
   */
  const clearHoveredRegion = (): void => {
    hoveredRegion.value = null;
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
