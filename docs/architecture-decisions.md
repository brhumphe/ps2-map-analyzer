# PS2 Territory Analyzer - Architectural Decisions & Design Patterns

## Major Architectural Decisions

### 1. Incremental Vue Migration Strategy

**Decision**: Wrap existing TypeScript logic in Vue's composition API initially, then gradually extract components and introduce reactive state management.

**Reasoning**:

- Preserve complex working code (coordinate conversion, hexagon geometry, Leaflet integration)
- Reduce migration risk by avoiding "big bang" rewrites
- Enable learning Vue patterns without breaking existing functionality
- Allow gradual introduction of Vue benefits (reactivity, component lifecycle)

**Impact**:

- Faster initial migration with a working Vue application
- Lower risk of introducing bugs in complex mathematical code
- Established foundation for incremental feature extraction
- Proven approach for migrating complex applications to Vue

### 2. Headless Component Architecture for Leaflet Objects

**Decision**: Create headless Vue components (`PolylineEntity`, `PolygonEntity`, `MarkerEntity`) that manage individual Leaflet objects without visual templates.

**Reasoning**:

- Separate Leaflet object lifecycle from business logic
- Enable reactive updates to individual map elements
- Leverage Vue's component system for object management
- Avoid coupling rendering concerns with domain logic
- Allow individual object updates without full map re-renders

**Impact**:

- Clean separation between Vue reactivity and Leaflet object management
- Efficient updates (only changed objects re-render)
- Reusable pattern for any map visualization needs (polylines, polygons, markers)
- Easy testing of individual object behavior
- Foundation for complex map interactions and tooltip-based labels

### 3. Provider Pattern for Analysis and Styling

**Decision**: Use interface-based providers (`ILinkAnalysisProvider`, `ILinkStyleProvider`) for swappable implementations.

**Reasoning**:

- Enable switching between client-side and remote analysis
- Support multiple visualization modes without code changes
- Facilitate testing with mock implementations
- Demonstrate architectural flexibility for portfolio
- Future-proof for unknown analysis requirements

**Impact**:

- Easy to add new visualization modes
- Testable analysis logic independent of UI
- Clear contracts between analysis and presentation layers
- Demonstrated understanding of enterprise architectural patterns
- Foundation for A/B testing different analysis approaches

### 4. Individual Reactive Objects vs. Large Nested Structures

**Decision**: Use separate reactive objects for different concerns (regions, links, UI state) rather than one large nested reactive structure.

**Reasoning**:

- Better performance for frequent updates (avoid deep watching)
- Clearer separation of concerns
- Minimize component re-renders when only specific data changes
- Optimize for bulk territory updates affecting many regions
- Enable granular control over what triggers reactivity

**Impact**:

- Efficient handling of bulk API responses (100+ regions)
- Reduced unnecessary component updates
- Clearer data ownership and responsibility boundaries
- Better performance for high-frequency map interactions
- Scalable approach for large datasets

### 5. Client-Side Analysis Over Backend Processing

**Decision**: Default to client-side territory analysis with optional backend processing via provider pattern.

**Reasoning**:

- Network latency (50-200ms) dominates computation time for small datasets (89 nodes)
- Better user experience with immediate responsiveness
- Simpler deployment and demonstration
- Honest engineering judgment over "enterprise" patterns
- Architecture supports backend when actually beneficial

**Impact**:

- Immediate tactical feedback for users
- Simpler development and deployment workflow
- Demonstrates performance-conscious architectural decisions
- Maintains flexibility for future scaling needs
- Better portfolio story (UX-focused rather than complexity-focused)

## Design Patterns Established

### 1. Reactive Pipeline Pattern

**Decision**: Create a unidirectional data flow from territory data through analysis to styling to visual rendering.

**Reasoning**:

- Predictable state updates following Vue's reactive philosophy
- Clear data transformation stages
- Easy debugging with explicit pipeline stages
- Separation of pure functions from reactive state management

**Impact**:

```
Territory Data → Analysis → Styling → Components → Leaflet Objects
     ↓              ↓         ↓          ↓              ↓
Reactive State → Computed → Computed → Props → Watchers
```

- Automatic updates when territory changes
- Clear debugging path for visual issues
- Testable transformation stages
- Foundation for complex analysis features

### 2. Composable Orchestration Pattern

**Decision**: Use composables for coordination rather than business logic, with services handling pure domain operations.

**Reasoning**:

- Composables excel at reactive state management and Vue integration
- Business logic belongs in testable, framework-agnostic services
- Clear separation between "what to do" and "how Vue should react"
- Maintains testability of core domain logic

**Impact**:

```typescript
// Composable: Vue integration + coordination
export function useLinkVisualization() {
  const linkAnalyzer = new ContestableLinksAnalyzer() // Service
  const linkStyles = computed(() => analyzer.analyze(...)) // Reactive coordination
}
```

- Business logic testable without Vue
- Clear responsibility boundaries
- Reusable domain logic across different UI frameworks
- Maintainable reactive systems

### 3. Branded Type Safety Pattern

**Decision**: Use branded types (`FacilityLinkKey`) for domain-specific identifiers to prevent type confusion.

**Reasoning**:

- Prevent accidental string mixing between different key types
- Maintain runtime performance (zero overhead)
- Clear semantic meaning in type system
- Enable future extension without breaking changes

**Impact**:

```typescript
type FacilityLinkKey = `${number}-${number}` & { readonly __brand: 'LinkKey' };
```

- Compile-time safety for map key operations
- Clear documentation of expected string formats
- Prevention of hard-to-debug identifier mixups
- Foundation for multiple key types in same system

### 4. User Control Layer Pattern

**Decision**: Implement display settings as a separate reactive layer (`MapSettingsMenu` + `useMapDisplaySettings`) that controls component visibility rather than embedding controls in individual components.

**Reasoning**:

- Centralized user control without component coupling
- Consistent UI patterns for all display toggles
- Clear separation between data rendering and user preferences
- Enable bulk visibility changes without component coordination
- Foundation for advanced display modes and filtering

**Impact**:

```typescript
// Central settings control visibility
const displaySettings = useMapDisplaySettings();

// Components conditionally render based on settings
<PolylineEntity v-if="displaySettings.showLatticeLinks" ... />
<MarkerEntity v-if="displaySettings.showFacilityNames" ... />
```

- Unified user control interface for all map layers
- Reactive visibility changes without component re-implementation
- Clear architectural boundary between user preferences and data rendering
- Extensible foundation for complex display modes

### 5. Interface-First Design Pattern

**Decision**: Define provider interfaces before implementations, establishing contracts early.

**Reasoning**:

- Clear API boundaries before implementation details
- Enable parallel development of different providers
- Force consideration of abstraction level
- Support test-driven development approach

**Impact**:

- Well-defined contracts prevent coupling issues
- Easy to add new implementations
- Clear expectations for provider behavior
- Testable with mock implementations

## Data Flow Patterns

### 1. Normalized Data Transformation

**Decision**: Transform API responses into normalized frontend-optimized formats (`TerritorySnapshot`).

**Reasoning**:

- API data structures optimized for server concerns, not frontend consumption
- Normalize for efficient frontend operations (O(1) lookups)
- Abstract away API format changes
- Optimize for Vue reactivity and template rendering

**Impact**:

```typescript
// API Format (server-optimized)
{ map_state_list: [{ map_region_id: 123, owning_faction_id: 1, last_updated: ... }] }

// Frontend Format (client-optimized)
{ regions: { 123: 1, 124: 2, 125: 1 }, timestamp: ..., continent: ... }
```

- Fast region ownership lookups
- Template-friendly iteration
- Resilient to API changes
- Optimized for analysis calculations

### 2. Computed Style Propagation

**Decision**: Use Vue's computed properties to automatically propagate style changes through the component tree.

**Reasoning**:

- Leverage Vue's automatic dependency tracking
- Minimize manual update coordination
- Ensure visual consistency with data state
- Optimize re-computation through Vue's caching

**Impact**:

```typescript
const linkStyles = computed(() => {
  return calculateStyles(territoryData.value, displayMode.value);
});
```

- Automatic updates when territory or mode changes
- Efficient re-computation (only when dependencies change)
- No manual event handling or update coordination
- Consistent visual state with underlying data

### 3. Layer-Based Rendering Order

**Decision**: Use Leaflet panes for z-ordering rather than manual layer management.

**Reasoning**:

- Leverage Leaflet's built-in layer management
- Avoid complex manual z-index coordination
- Predictable rendering order
- Better performance than manual layer manipulation

**Impact**:

```typescript
// Regions render on overlayPane (z-index: 200)
// Links render on markerPane (z-index: 600)
```

- Consistent visual layering
- No z-index conflicts
- Leverages Leaflet optimizations
- Simplified rendering logic

## Trade-offs and Resolutions

### 1. Code Sharing vs. Component Clarity

**Trade-off**: Share code between `PolylineEntity` and `PolygonEntity` vs. accept near-duplication.

**Resolution**: Accept near-duplication for component clarity.

**Reasoning**:

- Components might diverge (polygons may need click handlers, selection)
- Shared abstraction would be complex for minimal duplication
- Clear component responsibility more valuable than DRY principle
- Easier future customization

**Impact**: Clean, focused components with room for specialized behavior

### 2. Template Reactivity vs. Type Safety

**Trade-off**: Vue templates need reactive Map iteration, but readonly wrappers cause template issues.

**Resolution**: Skip readonly wrapper for Maps, rely on composable API for mutation control.

**Reasoning**:

- Template layer is read-only by nature
- Mutation control happens at composable level
- readonly wrapper complexity not worth theoretical protection
- Focus protection where it matters (composable methods)

**Impact**: Simpler reactive templates with pragmatic type safety

### 3. Backend Portfolio Value vs. User Experience

**Trade-off**: Build backend for portfolio demonstration vs. optimize for user experience.

**Resolution**: Start client-only, add backend later for different reasons (API integration, caching).

**Reasoning**:

- Building architecture just for "enterprise appearance" is poor engineering
- Network latency objectively worse than client computation for this scale
- Better portfolio story: "made performance-conscious decisions"
- Backend valuable for API integration, not computation

**Impact**: Honest engineering decisions showcasing user-focused thinking

### 4. Generic Components vs. Specific Implementation

**Trade-off**: Create generic geometry component vs. separate polyline/polygon components.

**Resolution**: Separate components for different Leaflet object types.

**Reasoning**:

- Different Leaflet APIs (polyline vs polygon)
- Likely divergent feature needs
- Generic solution would require complex type handling
- Clear component boundaries more valuable

**Impact**: Maintainable components with clear responsibilities

### 5. Analysis Provider Granularity

**Trade-off**: Single shared `LinkState` type vs. provider-specific analysis types.

**Resolution**: Single shared enumeration for all providers.

**Reasoning**:

- All providers analyzing same domain (lattice links)
- Swappable providers need common interface
- Style providers can interpret any link state
- Simpler type system for MVP scope

**Impact**: Clear provider contracts with easy swapping

### 6. Directory Structure Complexity

**Trade-off**: Flat directory structure vs. organized by architectural layers.

**Resolution**: Layer-based organization with clear provider separation.

**Reasoning**:

- Architecture should be visible in file structure
- Easy to find related functionality
- Clear separation of concerns
- Scales well with feature growth

**Impact**:

```
composables/
├── map/           # Leaflet management
├── territory/     # Coordination
└── providers/     # Swappable implementations
    ├── analysis/
    └── styling/
```

- Self-documenting architecture
- Easy to locate related code
- Clear responsibility boundaries

## Key Architectural Insights

### 1. Incremental Complexity Management

**Insight**: Start with simplest working solution, add sophistication gradually.

**Application**: Vue migration, provider implementation, feature development

**Value**: Maintains working system while building toward sophisticated architecture

### 2. User Experience Drives Architecture

**Insight**: Technical decisions should optimize for user outcomes, not architectural aesthetics.

**Application**: Client-side analysis, reactive updates, performance optimization

**Value**: Demonstrates user-focused engineering judgment

### 3. Interface-Based Flexibility

**Insight**: Design for change by defining clear contracts between system layers.

**Application**: Provider patterns, composable APIs, data transformation

**Value**: Enables evolution without breaking existing functionality

### 4. Vue Reactivity as System Backbone

**Insight**: Leverage Vue's reactive system for automatic coordination rather than manual event handling.

**Application**: Territory updates, style propagation, component synchronization

**Value**: Reduces complexity while ensuring system consistency
