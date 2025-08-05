import type { RegionState } from '@/types/region_analysis';
import type L from 'leaflet';
import { Faction } from '@/types/common';
import { setColorBrightness, unpackIntToHex } from '@/utilities/colors';

// Census gives these packed int representations instead of hex strings
const FactionColor = new Map<Faction, string>([
  [Faction.NONE, unpackIntToHex(7500402)],
  [Faction.VS, unpackIntToHex(4460130)],
  [Faction.NC, unpackIntToHex(19328)],
  [Faction.TR, unpackIntToHex(10357519)],
  [Faction.NSO, unpackIntToHex(5662067)],
]);

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

    const faction_color: string =
      FactionColor.get(regionState.owning_faction_id) || '#ff00ff';
    let border_color = faction_color;
    let fill_color: string = setColorBrightness(border_color, 0.7);

    if (!regionState.can_capture) {
      fill_color = setColorBrightness(faction_color, 0.2);
    }
    if (regionState.can_steal) {
      border_color = '#2eff00';
    }
    return {
      ...baseStyle,
      color: border_color,
      fillColor: fill_color,
    };
  }
}
