// composables/useAppState.ts
import { readonly, ref } from 'vue';
import { Continent, World } from '@/types/common';

// Singleton state - shared across all component instances
const selectedContinent = ref<Continent>(Continent.INDAR);
const selectedWorld = ref<World>(World.Osprey);

/**
 * Application-level state management for continent and server selection.
 *
 * This composable manages the core application state that determines:
 * - Which continent's map tiles to display
 * - Which server's territory data to fetch
 *
 * State does not persist across browser sessions by design.
 */
export function useAppState() {
  // Actions
  const setContinent = (continent: Continent) => {
    selectedContinent.value = continent;
  };

  const setWorld = (world: World) => {
    selectedWorld.value = world;
  };

  const reset = () => {
    selectedContinent.value = Continent.INDAR;
    selectedWorld.value = World.Osprey;
  };

  // Read-only state exposure
  return {
    // State (readonly to prevent direct mutation)
    selectedContinent: readonly(selectedContinent),
    selectedWorld: readonly(selectedWorld),

    // Actions (only way to modify state)
    setContinent,
    setWorld,
    reset,
  };
}
