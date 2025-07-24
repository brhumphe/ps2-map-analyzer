import type { TerritorySnapshot, TerritoryAnalysisProvider, LinkState } from '@/types/territory';
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
  analyzeLinkStates(territory: TerritorySnapshot, zone: Zone): Map<FacilityLinkKey, LinkState> {
    const linkStates = new Map<FacilityLinkKey, LinkState>();
    
    console.log(`ContestableLinksAnalyzer: Analyzing ${zone.links.length} lattice links`);
    console.log('First few links:', zone.links.slice(0, 3).map(l => `${l.facility_id_a}-${l.facility_id_b}`));
    console.log('First few regions:', zone.regions.slice(0, 3).map(r => `facility_id: ${r.facility_id}, region_id: ${r.map_region_id}`));
    
    let processedCount = 0;
    let skippedCount = 0;
    
    zone.links.forEach((link, index) => {
      if (index < 5) {
        console.log(`Processing link ${index}: ${link.facility_id_a}-${link.facility_id_b}`);
      }
      
      const linkKey = zoneUtils.getLinkKey(link);
      
      if (index < 5) {
        console.log(`Generated linkKey: ${linkKey}`);
      }
      
      // Get region ownership for both connected facilities
      const regionA = zone.regions.find(r => r.facility_id === link.facility_id_a);
      const regionB = zone.regions.find(r => r.facility_id === link.facility_id_b);
      
      if (!regionA || !regionB) {
        // Can't analyze if we don't have region data for both facilities
        if (index < 5) {
          console.warn(`ContestableLinksAnalyzer: Missing region data for link ${link.facility_id_a}-${link.facility_id_b}, regionA=${!!regionA}, regionB=${!!regionB}`);
        }
        linkStates.set(linkKey, 'inactive');
        skippedCount++;
        return;
      }
      
      processedCount++;
      
      const ownerA = territory.region_ownership[regionA.map_region_id];
      const ownerB = territory.region_ownership[regionB.map_region_id];
      
      // If either owner is None (0) or missing, link is inactive
      if (ownerA == null || ownerA === 0 || ownerB == null || ownerB === 0) {
        linkStates.set(linkKey, 'inactive');
      } else if (ownerA === ownerB) {
        // Same faction controls both ends
        switch (ownerA) {
          case 1: linkStates.set(linkKey, 'VS'); break;
          case 2: linkStates.set(linkKey, 'NC'); break;
          case 3: linkStates.set(linkKey, 'TR'); break;
          case 4: linkStates.set(linkKey, 'NSO'); break;
          default: linkStates.set(linkKey, 'inactive'); break;
        }
      } else {
        // Different factions and neither is None = contestable link
        linkStates.set(linkKey, 'contestable');
      }
    });
    
    const contestableCount = Array.from(linkStates.values()).filter(state => state === 'contestable').length;
    console.log(`ContestableLinksAnalyzer: Found ${contestableCount} contestable links out of ${linkStates.size} total`);
    console.log(`ContestableLinksAnalyzer: Processed ${processedCount}, Skipped ${skippedCount} links due to missing region data`);
    
    return linkStates;
  }
}