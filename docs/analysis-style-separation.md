# PlanetSide 2 Territory Analyzer - Style and Analysis Architecture

## Overview

This document describes the architectural design for the territory analysis and visualization system in the PS2 Territory Analyzer. The architecture is built around a clean separation of concerns that allows for flexible data processing while maintaining reactive user interfaces.

## Core Design Principles

### Separation of Concerns
The system separates three distinct responsibilities:
1. **Data Analysis**: Converting raw territory data into meaningful link and region states
2. **Style Calculation**: Translating link and region states into visual representations
3. **Component Rendering**: Managing Leaflet objects and their lifecycle

### Provider Pattern Flexibility
The architecture uses interface-based providers that allow the system to switch between local and remote analysis without changing the visualization layer. This enables optimization for user experience while maintaining architectural flexibility.

### Reactive Data Flow
Vue's reactivity system drives updates through the entire pipeline, ensuring that changes in territory data automatically propagate through analysis, styling, and visual rendering.

## Information Flow Architecture

```
Raw Territory Data
        ↓
Territory Data Service (Backend Integration)
        ↓
Link Analysis Provider (Configurable: Local or Remote)
        ↓
Link States (Domain Model)
        ↓
Display Mode Processor (Style Calculation)
        ↓
Reactive Style Maps
        ↓
Vue Components (PolylineEntity/PolygonEntity)
        ↓
Leaflet Map Visualization
```

## Layer Breakdown

### 1. Territory Data Layer

**Purpose**: This layer handles the integration with external data sources and provides a clean, normalized view of territory ownership.

**Components**:
- `TerritoryService`: Manages API integration and data fetching
- `TerritorySnapshot`: Standardized data format containing region ownership information

**Key Characteristics**:
- Abstracts away third-party API complexities
- Provides caching and rate limiting
- Emits standardized data formats that downstream layers can depend on

### 2. Analysis Provider Layer

**Purpose**: This layer transforms territory ownership data into strategic link classifications that describe the tactical significance of each lattice connection.

**Interface Design**:
```typescript
interface ILinkAnalysisProvider {
  analyzeLinkStates(
    territoryData: TerritorySnapshot, 
    zone: Zone
  ): Promise<Map<FacilityLinkKey, LinkState>>
}
```

**Implementation Options**:

**Client-Side Provider** (Implemented):
- Performs analysis locally in the browser
- Optimized for immediate responsiveness
- Handles current scale (89 regions, 129 links) efficiently
- Zero network latency for analysis operations
- Implementation: `ContestableLinksAnalyzer` and `RegionOwnershipAnalyzer`

**Remote Provider** (Future Enhancement):
- Would delegate analysis to backend services
- Could enable more complex algorithms
- Available for scenarios where analysis becomes computationally expensive

**Link State Classification**:
The analysis produces one of six possible states for each lattice link:
- `inactive`: Link is not operational
- `NC`, `TR`, `VS`, `NSO`: Both connected bases controlled by the same faction
- `contestable`: Connected bases have different faction ownership

### 3. Style Calculation Layer

**Purpose**: This layer translates strategic link states into visual styling information, completely independent of how those states were calculated.

**Design Pattern**:
```typescript
function calculateStyleForMode(
  state: LinkState, 
  mode: DisplayMode
): L.PolylineOptions {
  // Pure function - no side effects or external dependencies
  switch (mode) {
    case 'contestable-links':
      return contestableLinksStyle(state)
    case 'faction-control':
      return factionControlStyle(state)
  }
}
```

**Display Mode System**:
The architecture supports multiple visualization modes that can interpret the same link states differently:

**Contestable Links Mode** (MVP):
- Highlights links that connect bases with different faction ownership
- De-emphasizes secure faction-controlled links
- Optimized for identifying tactical opportunities

**Future Mode Examples**:
- **Front Line Visualization**: Shows proximity to contested areas
- **Strategic Value Mapping**: Emphasizes high-value tactical connections
- **Historical Analysis**: Displays patterns over time

### 4. Reactive Integration Layer

**Purpose**: This layer connects the analysis and styling systems to Vue's reactive ecosystem, ensuring that changes propagate automatically through the entire visualization pipeline.

**Vue Composable Structure**:

**Territory Management** (`useTerritoryData`):
```typescript
// Manages raw territory data and updates
const territoryData = ref<TerritorySnapshot>()
const updateTerritory = (newData: TerritorySnapshot) => {
  territoryData.value = newData
}
```

**Analysis Coordination** (`useLinkAnalysis`):
```typescript
// Coordinates analysis provider and maintains link states
const linkStates = ref<Map<FacilityLinkKey, LinkState>>()

watch(territoryData, async (newData) => {
  if (newData && currentZone.value) {
    // Provider is configurable - client or remote
    const states = await linkAnalyzer.analyzeLinkStates(newData, currentZone.value)
    linkStates.value = states
  }
})
```

**Style Processing** (`useDisplayModes`):
```typescript
// Converts link states to visual styles
const linkStyles = computed(() => {
  const styles = new Map<FacilityLinkKey, L.PolylineOptions>()
  
  for (const [linkKey, state] of linkStates.value) {
    styles.set(linkKey, calculateStyleForMode(state, currentMode.value))
  }
  
  return styles
})
```

### 5. Component Rendering Layer

**Purpose**: This layer manages the lifecycle of Leaflet objects and their synchronization with Vue's reactive state.

**Component Architecture**:

**Headless Components**:
- `PolylineEntity`: Manages individual Leaflet polyline objects
- `PolygonEntity`: Manages individual Leaflet polygon objects

**Reactive Props**:
Each component receives reactive styling information and automatically updates the underlying Leaflet objects when styles change.

**Template Integration**:
```vue
<template>
  <!-- Lattice links rendered as individual components -->
  <PolylineEntity
    v-for="[linkId, linkData] in latticeLinks"
    :key="linkId"
    :id="linkId"
    :points="linkData.points"
    :style="linkStyles.get(linkId) || defaultStyle"
    :map="map"
  />
</template>
```

## Benefits of This Architecture

### Flexibility and Evolution
The provider pattern allows the system to evolve from local analysis to remote processing without changing visualization code. This enables optimization based on actual usage patterns rather than premature architectural decisions.

### Testing and Maintenance
Each layer can be tested independently. Analysis logic can be verified with mock territory data, style calculations can be tested with known link states, and components can be tested with mock styling information.

### Performance Optimization
The separation allows each layer to be optimized independently. Analysis can be cached, style calculations can be memoized, and component updates can be batched.

### User Experience Focus
The architecture prioritizes responsiveness by defaulting to local analysis while maintaining the flexibility to move computation to the backend when justified by complexity or scale.

## Data Flow Example

Consider a scenario where territory control changes:

1. **Data Update**: Backend receives new territory information from PS2 APIs
2. **Normalization**: Territory service converts raw API data into `TerritorySnapshot` format
3. **Analysis Trigger**: Vue watcher detects territory data change
4. **Link Analysis**: Provider calculates new link states (e.g., a link changes from "TR" to "contestable")
5. **Style Calculation**: Display mode processor generates new styling for affected links
6. **Component Update**: Vue reactivity triggers `PolylineEntity` components to update their Leaflet objects
7. **Visual Result**: User sees lattice links change color to reflect new tactical situation

This entire pipeline executes automatically through Vue's reactive system, ensuring that the visualization always reflects the current tactical state without manual coordination between layers.

## Configuration and Deployment

The system supports runtime configuration of analysis providers through environment variables or user preferences, allowing the same codebase to operate in different modes:

**Development Mode**: Local analysis for fast iteration
**Production Mode**: Configurable based on performance requirements
**Demo Mode**: Mock data providers for presentations

This flexibility demonstrates architectural thinking while maintaining practical usability across different deployment scenarios.

## Implementation Status

### Completed Components

**Analysis Providers**:
- `RegionOwnershipAnalyzer` (`services/analysis/RegionOwnershipAnalyzer.ts`): Simple passthrough from faction ownership to region states
- `ContestableLinksAnalyzer` (`services/analysis/ContestableLinksAnalyzer.ts`): Identifies tactical opportunities by analyzing link endpoints

**Style Calculators**:
- `RegionStyleCalculator` (`services/styling/RegionStyleCalculator.ts`): Maps region states to faction colors and visual properties
- `LinkStyleCalculator` (`services/styling/LinkStyleCalculator.ts`): Maps link states to colors and weights emphasizing contestable links

**Reactive Integration**:
- `useRegionAnalysis` (`composables/useRegionAnalysis.ts`): Coordinates region analysis and styling pipeline
- `useLinkAnalysis` (`composables/useLinkAnalysis.ts`): Coordinates lattice link analysis and styling pipeline
- `useTerritoryData` (`composables/useTerritoryData.ts`): Manages territory data fetching with development mode support

**Component Integration**:
- Updated `useRegionPolygons` to accept and apply analysis-based styles
- Updated `useLatticeLinks` to accept and apply analysis-based styles
- Resolved timing issues with initialization order and style application

### Visual Results

**Region Display**:
- VS regions: Purple fill (#441c7a)
- NC regions: Blue fill (#004bad)
- TR regions: Red fill (#9d2621)
- NSO regions: Gray fill (#565851)
- Unknown/none regions: Light gray (#cccccc)

**Link Display**:
- Contestable links: Bright yellow (#ffff00), thick lines for tactical emphasis
- Faction-controlled links: Faction colors, medium thickness
- Inactive links: Dim gray (#666666), thin lines, low opacity

The complete reactive pipeline is functional with automatic updates when territory data changes.
