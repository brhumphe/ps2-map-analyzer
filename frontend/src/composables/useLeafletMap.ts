import { readonly, ref } from 'vue';
import type { Map as LMap } from 'leaflet';
import * as L from 'leaflet';
import { ZoneService } from '@/services/zone_service';
import { Continent } from '@/types/common';
import type { Zone } from '@/types/zone_types';
import {
  configureMapTileLayer,
  initMouseCoordinatesPopup,
} from '@/utilities/leaflet_utils';

export function useLeafletMap() {
  // Reactive state
  const map = ref<LMap>();
  const currentZone = ref<Zone | null>(null);
  const isLoading = ref(false);
  const error = ref<string>();

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
      const zoneService = new ZoneService();
      const zone = await zoneService.fetchZone(continent);
      currentZone.value = zone;

      // Create the Leaflet map
      const leafletMap = L.map(container, {
        crs: L.CRS.Simple,
        center: [0, 0],
      }).setView([0, 0], 0);

      map.value = leafletMap;

      // Initialize map features
      // initMouseCoordinatesPopup(leafletMap);
      configureMapTileLayer(leafletMap, zone.code.toLowerCase());
      initMouseCoordinatesPopup(leafletMap);

      console.log('Map initialized successfully for continent:', continent);
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

  return {
    // State. Not intended to be mutated, but `readonly` can erase types which cause
    // erroneous type errors
    map,
    currentZone: currentZone,
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    initializeMap,
    cleanupMap,
    switchContinent,
  };
}
