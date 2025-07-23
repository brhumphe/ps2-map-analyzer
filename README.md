# PS2 Territory Analyzer

A tactical visualization tool for PlanetSide 2 that helps players make strategic decisions by visualizing lattice connections, territory ownership, and tactical opportunities on interactive maps.

## Why This Tool?

Existing PlanetSide 2 community tools (Fisu, Honu, Voidwell) excel at showing historical data but lack strategic analysis:
- **Static Information**: Display current territory control without strategic context
- **Limited Predictive Value**: No analysis of what territories *could* be captured  
- **Missing Time Constraints**: Don't account for alert time limits in strategic planning

This tool focuses on **predictive analysis** and **strategic planning** to answer questions like "What's our best path to 40% territory before this alert ends?"

## Features

- **Real-time Territory Visualization**: Interactive maps showing current faction control
- **Tactical Analysis**: Identify contestable lattice links and strategic opportunities
- **Strategic Intelligence**: 
  - Time-based territory projection capabilities
  - Vulnerability analysis for critical territorial nodes
  - Cut-off territory detection and reconnection opportunities
- **Custom Map Integration**: PlanetSide 2 game maps with accurate coordinate transformation
- **Headless Component Architecture**: Efficient individual object updates without full re-renders
- **Responsive UI**: Vue 3 + Vuetify interface with dark theme optimized for tactical use

## Technology Stack

- **Frontend**: Vue 3 + Composition API + TypeScript + Vuetify + Leaflet.js
- **Mapping**: Custom coordinate conversion for PlanetSide 2 world coordinates
- **Data**: Third-party PS2 Census API integration
- **Optional Backend**: Python/FastAPI (available for experimentation)

## Quick Start

### Prerequisites

- **Node.js** 22.0.0 or higher
- **Python** 3.13 or higher (for optional backend)
- [uv](https://github.com/astral-sh/uv) for Python package management

### Frontend Development (Primary)

1. **Clone and install**:
   ```bash
   git clone https://github.com/yourusername/PS2MapState.git
   cd PS2MapState
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

3. **Other commands**:
   ```bash
   npm run build        # Production build
   npm run type-check   # TypeScript checking  
   npm run format       # Code formatting with Prettier
   npm run test         # Run Jest tests
   ```

### Optional Backend Setup

Originally designed as backend-focused, development revealed that client-side processing better serves this use case. The backend remains available for experimentation:

1. **Install Python dependencies**:
   ```bash
   uv pip install -e .
   uv pip install -e ".[dev]"
   ```

2. **Set up pre-commit hooks**:
   ```bash
   pre-commit install
   ```

3. **Start backend server**:
   ```bash
   uvicorn backend.main:app --reload
   ```
   Backend will be available at `http://localhost:8000`

## Project Architecture

### Architectural Evolution

This project demonstrates **iterative architectural decision-making** by evolving from initial assumptions to user-centered solutions:

- **Original Design**: Backend-focused analysis (leveraging Python expertise)
- **Discovery**: Client-side processing provides better UX (89 regions × O(n) < 1ms vs 50-200ms network latency)
- **Current State**: Frontend-first with optional backend for architectural experimentation

This evolution showcases **evidence-based architecture decisions** that prioritize user experience over technical preferences.

### Key Components
- **Interactive Maps**: Leaflet.js integration with custom PlanetSide 2 coordinate systems
- **Headless Architecture**: Individual Vue components manage Leaflet objects (polygons, polylines)
- **Provider Pattern**: Swappable analysis and styling providers for different visualization modes
- **Reactive Pipeline**: Vue reactivity drives updates through the entire visualization chain

### Project Structure
```
frontend/
  src/
    components/        # Vue components (headless map entities)
    composables/       # Vue composables for coordination logic  
    services/          # Business logic and API integration
    utilities/         # Pure functions (coordinates, geometry)
    types/            # TypeScript definitions
  tiles/              # Custom PlanetSide 2 map tiles
  
backend/              # Optional Python/FastAPI backend
  analysis/           # Territory analysis algorithms
  services/           # API service integrations
  shared/models/      # Common data models

docs/                 # Architecture and development documentation
```

## Domain Context

### PlanetSide 2 Game Mechanics
- **4 Continents**: Indar, Amerish, Esamir, Hossin (each ~89 capturable regions)
- **4 Factions**: VS (Purple), NC (Blue), TR (Red), NSO (Gray)  
- **Lattice System**: Strategic connections between facilities (~129 links per continent)
- **Territory Control**: Real-time ownership changes during large-scale battles

### Tactical Value
- **Contestable Links**: Connections between enemy facilities represent tactical opportunities
- **Territory Flow**: Visual analysis of faction control and strategic positioning
- **Real-time Updates**: Current territory status for immediate tactical decision-making

## Development

### Code Quality
- **Pre-commit hooks**: Automatic code formatting (Prettier) and linting (Ruff)
- **TypeScript**: Full type safety with strict configuration
- **Testing**: Jest for frontend, pytest for backend

### Architecture Patterns
- **Composition API**: Modern Vue 3 reactive patterns
- **Interface-based Design**: Provider pattern for extensibility
- **Pure Functions**: Testable utilities for coordinates and geometry
- **Incremental Development**: Small changes with verification at each step

## Portfolio Demonstration

This project showcases several advanced development practices:

- **Architecture Migration**: Procedural TypeScript → Reactive Vue 3 patterns
- **Complex Integration**: Vue reactivity with imperative mapping libraries (Leaflet)
- **Performance Engineering**: Client-side analysis optimization for real-time tactical decisions
- **Interface Design**: Provider patterns enabling swappable analysis/styling implementations
- **Domain Modeling**: Custom coordinate systems and complex data transformations

## Contributing

This project demonstrates modern frontend architecture patterns and would benefit from:
- Additional territory analysis algorithms
- Enhanced visualization modes
- Performance optimizations for large datasets
- Extended PlanetSide 2 game mechanic integration

See `docs/architecture.md` for detailed architectural theory, `CLAUDE.md` for development guidance, and `docs/ai-handoff-consolidated.md` for comprehensive project context.
