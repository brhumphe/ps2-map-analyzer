# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PS2 Territory Analyzer** - A tactical visualization tool for PlanetSide 2 that helps players make strategic decisions by visualizing lattice connections, territory ownership, and tactical opportunities on interactive maps.

**Architecture Focus**: Frontend-first Vue 3 application. Originally designed as backend-focused, development revealed that client-side processing better serves the use case. Territory analysis happens client-side for immediate responsiveness.

**Portfolio Context**: Project demonstrates refactoring skills by migrating from procedural TypeScript to reactive Vue architecture. Differentiates from typical CRUD applications through interactive data visualization, real-time strategic analysis, and complex state management across multiple data sources. Fills gap in existing PS2 community tools by focusing on predictive/strategic analysis rather than historical statistics.

## User Profile & Development Context

### Technical Background

- **Experience Level**: Senior software developer with database engine experience and legacy code refactoring expertise
- **Language Preferences**: Strong preference for typed languages (TypeScript > Python), dislikes untyped JavaScript
- **Previous Experience**: Python backend, database systems, Java, C#, some AWS
- **Frontend Experience**: Limited professional frontend work, basic HTML, educational HCI/UX background

### Career Context

- **Current Status**: Unemployed, actively job searching
- **Timeline Pressure**: Needs portfolio-ready project quickly
- **Target Roles**: Full-stack positions, senior IC roles preferred
- **Geographic Market**: Minnesota, US
- **Technology Strategy**: Building Vue/React framework experience based on job market demand

### Learning Style & Communication Preferences

- **Analytical Approach**: Questions assumptions, wants to understand "why" behind recommendations
- **Incremental Learning**: Builds understanding step-by-step, comfortable with complexity
- **Challenge Comfort**: Will push back on suggestions that seem overly complex or don't align with experience
- **Practical Focus**: Prefers actionable advice over theoretical discussions
- **Experience Leverage**: Has senior-level expertise in backend/database systems to draw upon

## Development Commands

### Frontend (Primary Development)

- **Install dependencies**: `npm install`
- **Development server**: `npm run dev` (Vite dev server on port 5173)
- **Build**: `npm run build`
- **Type checking**: `npm run type-check`
- **Format**: `npm run format` (Prettier)
- **Test**: `npm run test` (Jest)

### Backend (Optional/Portfolio Demo)

- **Install dependencies**: `uv pip install -e . && uv pip install -e ".[dev]"`
- **Lint**: `pre-commit run --all-files` (uses ruff)
- **Test**: `pytest`
- **Run server**: `uvicorn backend.main:app --reload` (port 8000, CORS enabled)

## Technical Stack & Architecture

### Core Technologies

- **Frontend**: Vue 3 + Composition API + TypeScript + Vuetify + Leaflet.js
- **Mapping**: Custom coordinate system (PS2 world coordinates ↔ Leaflet)
- **Data**: Third-party PS2 Census API for real-time territory data
- **Optional Backend**: Python/FastAPI (available for experimentation)

### Architectural Patterns

#### 1. Headless Component Architecture

Individual Vue components manage single Leaflet objects:

- `PolylineEntity` - Manages lattice links
- `PolygonEntity` - Manages region polygons
- `MarkerEntity` - Manages facility markers with tooltip-based labels
- Components bridge Vue reactivity with Leaflet object lifecycle

#### 2. Provider Pattern for Flexibility

Interface-based providers enable swappable implementations:

- **Analysis Providers**: Different territory analysis strategies
- **Style Providers**: Multiple visualization modes
- **Data Providers**: Client-side vs server-side processing

#### 3. Singleton Composable State Management

Centralized state management through specialized composables:

- `useAppState` - World/continent selection, session-only state
- `useMapDisplaySettings` - User display preferences with localStorage persistence
- `useTerritoryData` - Territory data fetching and management
- `useRegionMarkers` - Facility label management

#### 4. Reactive Data Pipeline

```
PS2 API → Territory Data Service → Analysis Provider → Style Provider → Vue Components → Leaflet Objects
```
Refer to vue-based-state-management.md for more details.

## Key Domain Knowledge

### PlanetSide 2 Context

Refer to `docs/domain-knowledge.md`

## Current Implementation Status

### ✅ Working Features

- Vue 3 application with Vuetify UI framework
- Leaflet map with custom PS2 tile layers (`frontend/tiles/indar/`)
- Zone data loading and hexagon boundary calculation
- Coordinate conversion utilities (`frontend/src/utilities/coordinates.ts`)
- Headless component rendering for lattice links, region polygons, and facility markers
- Territory data service integration with development mode
- Reactive map updates through Vue reactivity system
- **Complete territory analysis pipeline** with faction-based region coloring
- **Contestable link detection** with strategic visual emphasis
- **Automatic style updates** when territory data changes
- **Development data loading** from local JSON files
- **Live PS2 Census API integration** with proper data parsing
- **Map Display Settings** with `MapSettingsMenu` and toggleable controls
- **Facility Name Labels** using `MarkerEntity` with tooltip-based always-visible labels
- **Centralized State Management** via `useAppState` and `useMapDisplaySettings`
- **User Control Layer** with reactive visibility toggles for all map elements
- **Selective State Persistence** - localStorage for preferences, session-only for app data

### 🔄 Recently Implemented

- `useTerritoryData()` composable for territory state management
- `ContestableLinksAnalyzer` and `RegionOwnershipAnalyzer` implementations
- Style calculation layers for regions and links
- Reactive pipeline: territory data → analysis → styling → components
- Timing resolution for initialization order and style application
- **World/Continent Selection** with fully functional dropdown menus
- **Component Architecture Refactoring** separating MapApp.vue (UI) from MapComponent.vue (map logic)
- **Map Lifecycle Management** with destroy/recreate pattern for container reinitialization
- **External Tile Integration** with Honu tile server
- **Facility Label System** using MarkerEntity with permanent tooltips

### 🎯 Next Steps Available

1. **Auto-refresh System** - Periodic territory data updates from live API
2. **Performance Optimization** - Caching, selective updates, analysis throttling
3. **Additional Analysis Modes** - Front-line detection, strategic value scoring
4. **UI Polish** - Remove debug logs, add legend, territory statistics display
5. **Enhanced Display Modes** - More sophisticated analysis visualization options
6. **User-Customizable Styles** - Allow user to customize region/link colors

## Critical Implementation Notes

### Vue Reactivity Patterns

- Template iteration: Use `reactive(Map)` directly, avoid `readonly()` wrapper
- Individual reactive objects perform better than large nested structures
- Headless components require valid props (map instance, sufficient points)

### Performance Considerations

- Client-side analysis preferred: Network latency (50-200ms) dominates computation for ~89 regions
- Scale is manageable for browser processing (~89 regions, ~129 links per continent)
- Immediate responsiveness more important than computational sophistication

### Component Dependencies

- Map components require valid Leaflet map instance
- Analysis providers need both territory data AND zone data
- Z-ordering managed through Leaflet panes system

## Code Organization Patterns

### Directory Structure

- `frontend/src/components/`: Vue components (headless map entities)
- `frontend/src/composables/`: Vue composables for coordination logic
- `frontend/src/services/`: External API integration
- `frontend/src/providers/`: Business logic, including analysis and visual styling
- `frontend/src/utilities/`: Pure functions (coordinates, hexagons, etc.)
- `frontend/src/types/`: TypeScript type definitions

### Development Practices

- **Interface-first design** Always design interfaces and types, document responsibilities
- **Composables for coordination**, providers for business logic
- **Pure function extraction** for testable business logic
- **Incremental development** - small changes, verify, continue
- **Type-first approach** - define types before implementations

## Testing Strategy

- **Unit tests**: Pure functions in utilities/
- **Provider pattern testing**: Mock implementations for providers and services
- **Component testing**: Headless components with mock map instances
- **Integration testing**: Full reactive pipeline with test data

## Critical Developer Knowledge

### Common Gotchas & Easy Mistakes

#### 1. Vue Reactivity with Map Objects

```typescript
// ❌ This breaks template v-for iteration
const latticeLinks = readonly(reactive(new Map()));

// ✅ This works in templates
const latticeLinks = reactive(new Map());
```

**Issue**: Vue's template system has trouble tracking Map iterators through readonly proxies.
**Solution**: Skip readonly for Maps used in templates. Control mutations through composable API design.

#### 2. Coordinate System Confusion

```typescript
// ❌ Never use raw PS2 coordinates directly
L.marker([region.location_x, region.location_z]);

// ✅ Always use conversion utilities
L.marker(world_to_latLng({ x: region.location_x, z: region.location_z }));
```

**Critical**: ALL spatial data must go through coordinate conversion utilities in `coordinates.ts`.

#### 3. Leaflet Object Lifecycle Management

```typescript
// ✅ Always clean up Leaflet objects
onUnmounted(() => {
  if (marker.value && map.value) {
    map.value.removeLayer(marker.value);
  }
});
```

**Issue**: Leaflet objects persist even after Vue components are destroyed.

#### 4. Facility ID vs. Region ID Confusion

```typescript
// ❌ These are different concepts!
const facilityId = region.facility_id; // ID of main facility in region
const regionId = region.map_region_id; // ID of territorial region

// ✅ Use correct ID for context
const regionOwner = territory.regions[regionId]; // Use region ID
const facilityCoords = facility_coords[facilityId]; // Use facility ID
```

### Non-Obvious Dependencies

#### 1. Headless Component Requirements

Components silently fail if props are invalid:

```typescript
// These components REQUIRE:
// - Valid Leaflet map instance
// - At least 2 points (polyline) or 3 points (polygon)
// - Valid position (markers)
// - Non-null style object

// ✅ Always validate before rendering
<PolylineEntity
  v-if="map && linkData.points.length >= 2"
  :map="map"
  :points="linkData.points"
/>
<MarkerEntity
  v-if="map && facilityPosition"
  :map="map"
  :position="facilityPosition"
/>
```

#### 2. Analysis Pipeline Dependencies

Link analysis requires BOTH territory data AND zone data:

```typescript
// ✅ Verify both dependencies exist
if (territory && zone) {
  const linkStates = analyzer.analyzeLinkStates(territory, zone);
}
```

#### 3. PS2 Census API Characteristics

- Rate limits: ~100 requests/minute
- Territory data can be incomplete during server maintenance
- Null values indicate contested regions, not missing data
- Some facilities have missing coordinates

```typescript
// Always handle incomplete data
if (ownerA == null || ownerB == null) {
  return 'unknown'; // Don't assume data exists
}
```

### Key Files for Understanding

- **`src/utilities/coordinates.ts`** - ALL spatial operations go through `world_to_latLng()`
- **`src/utilities/zone_utils.ts`** - Link identifiers and facility coordinate mapping
- **`src/components/map/MapApp.vue`** - Main UI orchestration and app bar
- **`src/components/map/MapComponent.vue`** - Core map lifecycle and rendering logic
- **`src/components/map/MapSettingsMenu.vue`** - User display controls
- **`src/composables/useAppState.ts`** - Centralized world/continent state management
- **`src/composables/useMapDisplaySettings.ts`** - User preference management with localStorage
- **`src/composables/map/useLeafletMap.ts`** - Core map setup and management
- **`src/services/MapStateService.ts`** - Territory data fetching and normalization

## Debugging Approaches

### Spatial Issues

```typescript
// Enable mouse coordinates debug (already enabled)
initMouseCoordinatesPopup(leafletMap);
// Hover over map to see [x,z] coordinates

// Test coordinate conversion
const worldCoord = { x: 1000, z: 2000 };
const latLng = world_to_latLng(worldCoord);
const backToWorld = latLng_to_world(latLng);
console.log('Round trip:', worldCoord, '→', latLng, '→', backToWorld);
```

### Territory Data Issues

```typescript
watch(territorySnapshot, (territory) => {
  console.log('Territory update:', {
    regionCount: Object.keys(territory.regions).length,
    sampleRegions: Object.entries(territory.regions).slice(0, 5),
    timestamp: new Date(territory.timestamp * 1000),
  });
});
```

### Emergency Debugging Checklist

When something breaks, check these in order:

1. **Browser console** - Component error messages include ID prefixes
2. **Vue DevTools** - Check reactive state values
3. **Map container element** - Verify DOM element exists and has correct height
4. **Territory data structure** - Log territory snapshot to verify API data
5. **Coordinate conversion** - Test with known coordinates
6. **Provider configuration** - Verify correct providers are being used

## Technical Problems Solved

### Performance Solutions

#### 1. Template Reactivity with Map Objects

**Problem**: Vue templates couldn't iterate over `readonly(reactive(new Map()))`
**Solution**: Remove readonly wrapper from reactive Maps used in templates
**Why**: Template layer is inherently read-only, composable APIs provide mutation control

#### 2. Bulk Territory Updates

**Problem**: Territory updates affect 89 regions and 129 links simultaneously
**Solution**: Individual reactive objects per map element vs large nested structures

```typescript
// ✅ Individual reactive elements
const latticeLinks = reactive(new Map<FacilityLinkKey, LinkData>());
const regionPolygons = reactive(new Map<RegionKey, RegionData>());
```

**Result**: Only changed elements trigger re-renders, Vue optimizes updates

#### 3. Client vs Server Processing Decision

**Problem**: Should link analysis happen client-side or server-side?
**Solution**: Default client-side analysis (O(n) on 89 nodes < 1ms) vs network latency (50-200ms)
**Result**: Immediate user feedback for tactical decisions

### Coordinate System Solutions

#### 1. PS2 to Leaflet Coordinate Conversion

**Problem**: PS2 uses Y-up 3D coordinates, Leaflet uses 2D map coordinates
**Solution**: Bidirectional transformation with 90-degree rotation

```typescript
const worldToLatLng = (coords: WorldCoordinate): L.LatLng => {
  const rotationAngle = (90 * Math.PI) / 180;
  let newX =
    coords.x * Math.cos(rotationAngle) + coords.z * Math.sin(rotationAngle);
  let newY =
    coords.x * Math.sin(rotationAngle) - coords.z * Math.cos(rotationAngle);
  return L.latLng(newY, newX);
};
```

#### 2. Map Element Z-Ordering

**Problem**: Region polygons rendered above lattice links, making links invisible
**Solution**: Use Leaflet's pane system with explicit z-index

```typescript
// Region polygons: overlayPane (z-index: 200)
// Lattice links: markerPane (z-index: 600)
```

#### 3. Custom Tile Layer Implementation

**Problem**: PS2 tiles use `Indar_Tile_012_-004_LOD0.png` vs standard `{z}/{x}/{y}.png`
**Solution**: Override Leaflet's `getTileUrl` with custom coordinate transformation

### Data Pipeline Solutions

#### 1. API Response Transformation

**Problem**: Server-optimized API format inefficient for frontend
**Solution**: Transform to frontend-optimized structures

```typescript
// API: Array with O(n) searches
// Frontend: Record<RegionID, FactionID> for O(1) lookups
```

#### 2. Leaflet-Vue Lifecycle Bridge

**Problem**: Leaflet needs manual cleanup, Vue has automatic lifecycle
**Solution**: Headless components bridge the two systems

```typescript
onUnmounted(() => {
  if (polyline.value && props.map) {
    props.map.removeLayer(polyline.value);
  }
});
```

## Portfolio Context

This project demonstrates:

- Modern Vue 3 + Composition API patterns
- Complex TypeScript integration with external libraries
- Interactive data visualization with performance considerations
- Reactive state management in frontend applications
- Interface-based architecture for maintainability and testing

## Technical Evolution Context

### Migration Strategy

**Incremental Approach**: Migrated from procedural TypeScript to reactive Vue architecture gradually, preserving complex working code (coordinate conversion, hexagon geometry, Leaflet integration) while introducing Vue benefits step-by-step.

**Build System Decision**: Initially avoided complex build tools (Vite/webpack) to focus on Vue concepts, using import maps and inline components. Later evolved to proper build system as comfort with reactive patterns increased.

**Component Evolution**: Started with inline components in single files, progressed to headless component architecture, then to proper Vue component architecture with provider patterns.

## Communication Guidelines for AI Assistants

### Effective Interaction Patterns

- **Leverage Experience**: User has senior-level backend expertise - don't treat as beginner
- **Provide Context**: Explain why recommendations make sense for this specific use case and constraints
- **Show Examples**: Use concrete code examples from PS2 domain to illustrate concepts
- **Acknowledge Constraints**: Consider job search timeline and practical limitations
- **Build Incrementally**: Break complex changes into manageable steps
- **Respect Analysis**: User will question assumptions and wants to understand "why"

### Red Flags to Avoid

- **Overly Complex Solutions**: Don't suggest complex patterns without clear justification
- **Ignoring Timeline**: Remember this is portfolio project with job search pressure
- **Beginner Treatment**: User has database/backend expertise - leverage existing knowledge
- **Technology Trends**: Focus on practical portfolio value over latest frameworks
- **Major Rewrites**: Prefer incremental improvements over architectural overhauls

### Topics Requiring Special Attention

- **Vue Framework Migration**: Vue adoption is newer skill, needs clear reactive concept explanations
- **Portfolio Strategy**: Balance technical sophistication with development timeline
- **Performance Trade-offs**: Address when optimization complexity is worth the benefit
- **Type Safety**: Emphasize TypeScript patterns - aligns with user's language preferences

The architecture prioritizes user experience (immediate responsiveness) while demonstrating engineering sophistication through clean separation of concerns and flexible provider patterns.
