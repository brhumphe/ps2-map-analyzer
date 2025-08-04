import type { RegionState } from '@/types/region_analysis';
import type L from 'leaflet';
import { Faction } from '@/types/common';

/**
 * Region style calculator that converts region states into visual properties
 *
 * This layer is responsible for translating strategic analysis results into
 * concrete visual styling for Leaflet polygon objects. It maintains separation
 * between analysis (what does the data mean) and presentation (how should it look).
 */
export class RegionStyleCalculator {
  /**
   * Convert a region state to Leaflet polygon styling options
   *
   * Maps region control states to faction colors:
   * - VS: Purple/Teal (#441c7a)
   * - NC: Blue (#004bad)
   * - TR: Red (#9d2621)
   * - NSO: Gray (#565851)
   * - none: Light gray with low opacity
   * - unknown: Dark gray with dashed border
   *
   * @param regionState The strategic state of the region
   * @returns Leaflet PolylineOptions for styling the region polygon
   */
  calculateRegionStyle(regionState: RegionState): Partial<L.PolylineOptions> {
    const baseStyle: Partial<L.PolylineOptions> = {
      weight: 2,
      opacity: 1,
      fillOpacity: 0.6,
    };

    switch (regionState.owning_faction_id) {
      case Faction.VS:
        return {
          ...baseStyle,
          color: '#2a1a4a', // Dark purple border
          fillColor: '#441c7a', // VS purple fill
        };

      case Faction.NC:
        return {
          ...baseStyle,
          color: '#003380', // Dark blue border
          fillColor: '#004bad', // NC blue fill
        };

      case Faction.TR:
        return {
          ...baseStyle,
          color: '#661a17', // Dark red border
          fillColor: '#9d2621', // TR red fill
        };

      case Faction.NSO:
        return {
          ...baseStyle,
          color: '#3a3a35', // Dark gray border
          fillColor: '#565851', // NSO gray fill
        };

      case Faction.NONE:
        return {
          ...baseStyle,
          color: '#373737', // Medium gray border
          opacity: 0.7,
          fillColor: '#373737', // Light gray fill
          fillOpacity: 0.7, // Lower opacity for neutral
        };

      default:
        console.warn(
          `Failed to set style of ${regionState.region_id}`,
          regionState
        );
        // Fallback for any new states
        return {
          ...baseStyle,
          color: '#ff00ff', // Red border to indicate error
          fillColor: '#ffcccc', // Light red fill
          fillOpacity: 0.5,
        };
    }
  }
}
