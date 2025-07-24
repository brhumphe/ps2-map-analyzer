import type { RegionState } from '@/types/region_analysis';
import type L from 'leaflet';

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
    
    switch (regionState) {
      case 'VS':
        return {
          ...baseStyle,
          color: '#2a1a4a',      // Dark purple border
          fillColor: '#441c7a',   // VS purple fill
        };
        
      case 'NC':
        return {
          ...baseStyle,
          color: '#003380',       // Dark blue border
          fillColor: '#004bad',   // NC blue fill
        };
        
      case 'TR':
        return {
          ...baseStyle,
          color: '#661a17',       // Dark red border
          fillColor: '#9d2621',   // TR red fill
        };
        
      case 'NSO':
        return {
          ...baseStyle,
          color: '#3a3a35',       // Dark gray border
          fillColor: '#565851',   // NSO gray fill
        };
        
      case 'none':
        return {
          ...baseStyle,
          color: '#666666',       // Medium gray border
          fillColor: '#cccccc',   // Light gray fill
          fillOpacity: 0.3,       // Lower opacity for neutral
        };
        
      case 'unknown':
        return {
          ...baseStyle,
          color: '#333333',       // Dark gray border
          fillColor: '#999999',   // Medium gray fill
          fillOpacity: 0.4,
          dashArray: '5, 5',      // Dashed border to indicate uncertainty
        };
        
      default:
        // Fallback for any new states
        return {
          ...baseStyle,
          color: '#ff0000',       // Red border to indicate error
          fillColor: '#ffcccc',   // Light red fill
          fillOpacity: 0.5,
        };
    }
  }
  
}