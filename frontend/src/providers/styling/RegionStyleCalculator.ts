import type { RegionState } from '@/types/region_analysis';
import type L from 'leaflet';
import { Faction } from '@/types/common';
import {
  adjustColorLightnessSaturation,
  unpackIntToHex,
} from '@/utilities/colors';
import { RegionPane } from '@/utilities/leaflet_utils';

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
    let weight = 1;
    let opacity = 0.7;
    let fillOpacity = 0.6;
    let pane: RegionPane;

    const faction_color: string =
      FactionColor.get(regionState.owning_faction_id) || '#ff00ff';
    let border_color = '#404040';
    let fillColor: string = FactionColor.get(Faction.NONE) || '#ff00ff';
    if (regionState.can_steal) {
      fillColor = adjustColorLightnessSaturation(faction_color, 0.5, 1);
      fillOpacity = 0.8;
      border_color = '#2eff00';
      pane = RegionPane.PRIORITY;
      opacity = 1.0;
      weight = 4;
    } else if (regionState.can_capture) {
      fillColor = adjustColorLightnessSaturation(faction_color, 0.5, 1);
      fillOpacity = 0.8;
      opacity = 1.0;
      pane = RegionPane.FRONTLINE;
      border_color = '#000000';
    } else if (regionState.is_active) {
      fillColor = adjustColorLightnessSaturation(faction_color, -0.7, 0);
      fillOpacity = 0.6;
      opacity = 1.0;
      pane = RegionPane.BASE;
    } else {
      pane = RegionPane.INACTIVE;
      opacity = 0;
      fillOpacity = 0;
    }

    return {
      weight,
      opacity,
      fillOpacity,
      color: border_color,
      fillColor: fillColor,
      pane,
    };
  }
}
