import type {
  TerritorySnapshot,
  TerritoryAnalysisProvider,
  LinkState,
} from '@/types/territory';
import type { Zone, FacilityLinkKey } from '@/types/zone_types';
import { zoneUtils } from '@/utilities/zone_utils';

/**
 * Contestable links analyzer that identifies tactical opportunities
 *
 * This analyzer examines lattice connections to identify links that connect
 * facilities controlled by different factions, representing tactical opportunities
 * for attack or defense.
 */
export class ContestableLinksAnalyzer implements TerritoryAnalysisProvider {
  /**
   * Analyze lattice links to identify contestable connections
   *
   * Link analysis logic:
   * - 'inactive': One or both facilities controlled by None (0) or missing data
   * - 'contestable': Facilities controlled by different factions (neither is None)
   * - 'VS'/'NC'/'TR'/'NSO': Both facilities controlled by same faction
   *
   * @param territory Current territory snapshot with region ownership
   * @param zone Zone data containing lattice links and facility information
   * @returns Map of facility link keys to their strategic states
   */
  analyzeLinkStates(
    territory: TerritorySnapshot,
    zone: Zone
  ): Map<FacilityLinkKey, LinkState> {
    const linkStates = new Map<FacilityLinkKey, LinkState>();

    zone.links.forEach((link) => {
      const linkKey = zoneUtils.getLinkKey(link);

      // Get region ownership for both connected facilities
      const regionA_id = zone.facility_to_region_map.get(link.facility_id_a);
      const regionB_id = zone.facility_to_region_map.get(link.facility_id_b);
      if (!regionA_id || !regionB_id) {
        console.warn(`Link ${linkKey} has missing region IDs`);
        return;
      }
      const regionA = zone.regions.get(regionA_id);
      const regionB = zone.regions.get(regionB_id);

      if (!regionA || !regionB) {
        // Can't analyze if we don't have region data for both facilities
        linkStates.set(linkKey, 'inactive');
        console.warn(`Link ${linkKey} has missing region data`);
        return;
      }

      const ownerA = territory.region_ownership[regionA.map_region_id];
      const ownerB = territory.region_ownership[regionB.map_region_id];

      // If either owner is None (0) or missing, link is inactive
      if (ownerA == null || ownerA === 0 || ownerB == null || ownerB === 0) {
        linkStates.set(linkKey, 'inactive');
      } else if (ownerA === ownerB) {
        // Same faction controls both ends
        switch (ownerA) {
          case 1:
            linkStates.set(linkKey, 'VS');
            break;
          case 2:
            linkStates.set(linkKey, 'NC');
            break;
          case 3:
            linkStates.set(linkKey, 'TR');
            break;
          case 4:
            linkStates.set(linkKey, 'NSO');
            break;
          default:
            linkStates.set(linkKey, 'inactive');
            break;
        }
      } else {
        // Different factions and neither is None = contestable link
        linkStates.set(linkKey, 'contestable');
      }
    });

    return linkStates;
  }
}
