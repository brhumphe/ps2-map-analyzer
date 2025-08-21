# Planetside 2 Map Analyzer

## What does this project do?

With 60-100 bases to fight over in each of the major continents, it can be very overwhelming to understand the big picture without thousands of hours of in-game experience leading squads and platoons. The goal of this project is to make strategic gameplay more accessible.

This application provides a real-time view of each map, analyzes the current territory control state, and conveys this information visually to the user. The purpose is to surface useful information (e.g., what facilities are open to attack right now) while de-emphasizing less relevant info (e.g., bases unavailable to attack by the player's faction).

## Technical Overview

Built with Vue 3, Leaflet, and TypeScript. The Leaflet library provides the interactive map and map overlays. Headless Vue components manage each leaflet object, tying imperative leaflet operations to the Vue component lifecycle and reactive updates. The UI is made using Vuetify components for layout and styling.

Live territory control data is provided by the official Census API, with additional data provided by the community-run projects [Honu](https://wt.honu.pw/) and [Sanctuary](https://github.com/PS2Sanctuary/Sanctuary.Census. Includes automatic retry logic and user feedback for API failures.

## Links

Use it here: [Nanite Nexus](https://www.nanite.nexus/) or follow the directions below to build it manually.

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

### ON HOLD - Backend Setup

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
