import type { LinkState } from '@/types/territory';
import type L from 'leaflet';
import { LatticePane } from '@/utilities/leaflet_utils';
import { Faction } from '@/types/common';
import {
  adjustColorLightnessSaturation,
  FactionColor,
} from '@/utilities/colors';

/**
 * Link style calculator that converts link states into visual properties
 *
 * This layer translates strategic analysis results into concrete visual styling
 * for Leaflet polyline objects representing lattice connections.
 */
export class LinkStyleCalculator {
  /**
   * Convert a link state to Leaflet polyline styling options
   *
   * Visual design:
   * - Contestable links: Bright, thick lines to highlight tactical opportunities
   * - Faction-controlled links: Faction colors, medium thickness
   * - Inactive links: Dim gray, thin lines
   *
   * @param linkState The strategic state of the lattice link
   * @param playerFaction
   * @returns Leaflet PolylineOptions for styling the link
   */
  calculateLinkStyle(
    linkState: LinkState,
    playerFaction: Faction | undefined
  ): Partial<L.PolylineOptions> {
    const baseStyle: Partial<L.PolylineOptions> = {
      opacity: 1,
      pane: LatticePane.BASE,
      weight: 2,
    };

    switch (linkState.status) {
      case 'contestable':
        let weight_contestable = 2;
        let color_contestable = '#b58648';
        let opacity_contestable = 0.4;
        if (
          linkState.factionA === playerFaction ||
          linkState.factionB === playerFaction
        ) {
          // Player's faction is involved in the link - emphasize it
          weight_contestable = 6; // Thick line to emphasize importance
          color_contestable = '#ffff00'; // Bright yellow for visibility
          opacity_contestable = 0.9;
        }

        return {
          ...baseStyle,
          color: color_contestable,
          weight: weight_contestable,
          opacity: opacity_contestable,
          dashArray: '10',
          lineCap: 'butt',
          pane: LatticePane.FRONTLINE,
        };

      case 'safe':
        let color =
          FactionColor.get(linkState.faction ?? Faction.NONE) || '#ff00ff';
        let lightnessAdjustment = 0.5;
        let saturationAdjustment = 1;
        let opacity = 0.5;
        let weight = 2;
        if (linkState.faction === playerFaction) {
          lightnessAdjustment = 0.25;
          saturationAdjustment = 0;
          opacity = 1;
          weight = 6;
        }
        return {
          ...baseStyle,
          color: adjustColorLightnessSaturation(
            color,
            lightnessAdjustment,
            saturationAdjustment
          ),
          opacity,
          weight,
        };

      case 'inactive':
        return {
          ...baseStyle,
          color: FactionColor.get(Faction.NONE), // Dim gray
          weight: 2, // Thin line
          opacity: 0.3, // Low opacity
        };

      case 'unknown':
        return {
          ...baseStyle,
          color: '#ff0000', // Red to indicate error
          weight: 2,
          opacity: 0.5,
          dashArray: '3, 3', // Dashed to show uncertainty
        };

      default:
        // Fallback for any new states
        return {
          ...baseStyle,
          color: '#ff00ff', // Magenta to indicate unexpected state
          weight: 2,
          opacity: 0.5,
        };
    }
  }
}
