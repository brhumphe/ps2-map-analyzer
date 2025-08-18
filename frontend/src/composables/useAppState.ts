// composables/useAppState.ts
import { readonly, ref } from 'vue';
import { Continent, Faction, World } from '@/types/common';

// Singleton state - shared across all component instances
const selectedContinent = ref<Continent>(Continent.INDAR);
const selectedWorld = ref<World>(World.Osprey);
const playerFaction = ref<Faction>(Faction.NONE);
const useDevData = ref(false);

/**
 * Unified application state management for core app configuration.
 *
 * This composable manages:
 * - Core data selection (continent/world for API calls and map display)
 * - User context (player faction for tactical analysis and styling)
 * - Development mode (toggles between live Census API and local dev data)
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

  const setPlayerFaction = (faction: Faction) => {
    playerFaction.value = faction;
  };

  const setUseDevData = (value: boolean) => {
    useDevData.value = value;
  };

  const reset = () => {
    selectedContinent.value = Continent.INDAR;
    selectedWorld.value = World.Osprey;
    playerFaction.value = Faction.NONE;
    useDevData.value = false;
  };

  // Read-only state exposure
  return {
    // State (readonly to prevent direct mutation)
    selectedContinent: readonly(selectedContinent),
    selectedWorld: readonly(selectedWorld),
    playerFaction: readonly(playerFaction),
    useDevData: readonly(useDevData),

    // Actions (only way to modify state)
    setContinent,
    setWorld,
    setPlayerFaction,
    setUseDevData,
    reset,
  };
}
