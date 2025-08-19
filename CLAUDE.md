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
- **Data**: Mixture of Census and 3rd-party APIs
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

Refer to `docs/analysis-style-separation.md` for more details.

## Key Domain Knowledge

### PlanetSide 2 Context

Refer to `docs/domain-knowledge.md`

## Current Status

Refer to `docs/ai-handoff-consolidated.md`

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

**Issue**: Leaflet objects persist even after Vue components are destroyed unless manually removed.

#### 4. Leaflet Pane Switching for Dynamic States

```typescript
// ❌ This doesn't actually move the polygon to a new pane
polygon.setStyle({ pane: 'newPane', ...otherStyles });

// ✅ Must remove and re-add to change panes
const movePolygonToPane = (
  polygon: L.Polygon,
  newPane: string,
  newStyle: any
) => {
  const map = polygon._map;
  map.removeLayer(polygon);
  polygon.options.pane = newPane;
  polygon.setStyle(newStyle);
  polygon.addTo(map);
};
```

**Critical**: Leaflet doesn't automatically move objects between panes when the `pane` option changes.

#### 5. Facility ID vs. Region ID Confusion

There is always a 1:1 relationship between region IDs and facility IDs.
Some data may be keyed by facility ID, but most cases it should be keyed by region ID. Remap as necessary.

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
- Some facilities have missing coordinates
- Main API provided by Daybreak Games, Sanctuary wraps many collections and adds more detail, Honu provides tiles and additional data.

```typescript
// Always handle incomplete data
if (ownerA == null || ownerB == null) {
  return 'unknown'; // Don't assume data exists
}
```

### Key Files for Understanding

- **`docs/*`**: Documentation for project architecture, design decisions, and implementation notes
- **`frontend/src/components/map/*`**: Vue components for map entities and UI
- **`frontend/src/composables/*`**: Composable functions for reactive logic
- **`frontend/src/providers/*`**: Business logic for analysis and styling
- **`frontend/src/services/*`**: External API integration
- **`frontend/src/utilities/*`**: Pure functions for coordinate conversion, hexagon calculation, etc.
- **`frontend/src/types/*`**: TypeScript type definitions. **IMPORTANT**: Always import types from here!
