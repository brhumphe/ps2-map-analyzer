import type { LinkState } from '@/types/territory';
import type L from 'leaflet';
import { LatticePane } from '@/utilities/leaflet_utils';

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
   * @returns Leaflet PolylineOptions for styling the link
   */
  calculateLinkStyle(linkState: LinkState): Partial<L.PolylineOptions> {
    const baseStyle: Partial<L.PolylineOptions> = {
      opacity: 1,
      pane: LatticePane.BASE,
      weight: 2,
    };

    switch (linkState) {
      case 'contestable':
        return {
          ...baseStyle,
          color: '#ffff00', // Bright yellow for visibility
          weight: 6, // Thick line to emphasize importance
          opacity: 0.9,
          pane: LatticePane.FRONTLINE,
        };

      case 'VS':
        return {
          ...baseStyle,
          color: '#441c7a', // VS purple
          weight: 3, // Medium thickness
        };

      case 'NC':
        return {
          ...baseStyle,
          color: '#004bad', // NC blue
          weight: 3, // Medium thickness
        };

      case 'TR':
        return {
          ...baseStyle,
          color: '#9d2621', // TR red
          weight: 3, // Medium thickness
        };

      case 'NSO':
        return {
          ...baseStyle,
          color: '#565851', // NSO gray
          weight: 3, // Medium thickness
        };

      case 'inactive':
        return {
          ...baseStyle,
          color: '#666666', // Dim gray
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
