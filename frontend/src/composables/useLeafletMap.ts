import { ref } from 'vue';
import type { Map as LMap } from 'leaflet';
import * as L from 'leaflet';
import { Continent } from '@/types/common';
import type { Zone } from '@/types/zone_types';
import {
  configureMapTileLayer,
  createCustomPanes,
  // initMouseCoordinatesPopup,
} from '@/utilities/leaflet_utils';
import { useCensusData } from '@/composables/useCensusData';

// ============================================
// SINGLETON STATE - Shared across all components
// ============================================
const map = ref<LMap>();
const currentZone = ref<Zone | null>(null);
const isLoading = ref(false);
const error = ref<string>();

export function useLeafletMap() {
  const { dataService } = useCensusData();

  /**
   * Initialize the Leaflet map and load zone data
   */
  async function initializeMap(
    container: HTMLElement,
    continent: Continent = Continent.INDAR
  ) {
    try {
      isLoading.value = true;
      error.value = undefined;

      // Fetch and display zone data
      const zone = await dataService.getZoneData(continent);
      currentZone.value = zone;

      // Create the Leaflet map
      const leafletMap = L.map(container, {
        crs: L.CRS.Simple,
        center: [0, 0],
        zoomSnap: 0.25,
      }).setView([0, 0], 0);
      createCustomPanes(leafletMap);

      map.value = leafletMap;

      // Initialize map features
      // initMouseCoordinatesPopup(leafletMap);
      configureMapTileLayer(leafletMap, zone.code.toLowerCase());

      console.debug(
        'Leaflet map initialized successfully for continent:',
        continent
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to initialize map: ${errorMessage}`;
      console.error('Map initialization failed:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clean up the map instance
   */
  function cleanupMap() {
    if (map.value) {
      try {
        // Close any open popups before removing the map
        map.value.closePopup();
        // Stop any ongoing animations
        map.value.stop();
        // Remove the map
        map.value.remove();
      } catch (error) {
        console.warn('Error during map cleanup:', error);
      }
      map.value = undefined;
    }
    error.value = undefined;
  }

  /**
   * Switch to a different continent
   * Future enhancement - for now just reinitialize
   */
  async function switchContinent(continent: Continent) {
    if (!map.value) {
      throw new Error('Map not initialized');
    }

    // For now, a simple approach: clear and reload
    // Later this could be optimized to just update data layers
    const container = map.value.getContainer();
    cleanupMap();
    await initializeMap(container, continent);
  }

  /**
   * Get the map instance with runtime validation
   * Useful for child components that require the map
   */
  function getMap(): LMap {
    if (!map.value) {
      throw new Error('Map not initialized. Ensure MapComponent is mounted.');
    }
    return map.value;
  }

  /**
   * Check if map is initialized
   */
  function hasMap(): boolean {
    return !!map.value;
  }

  return {
    // State - shared across all components
    // These should not be mutated directly! Using readonly was causing type inference errors
    map,
    currentZone,
    isLoading,
    error,

    // Actions
    initializeMap,
    cleanupMap,
    switchContinent,

    // Utilities for child components
    getMap,
    hasMap,
  };
}
