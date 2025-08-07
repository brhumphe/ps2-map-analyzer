# Planetside 2 Domain Knowledge

- **Purpose**: Reference of essential information about Planetside 2 and the problem domain being addressed
- **Audience**: AI assistants and developers working on this project
- **See Also**: `docs/ai-handoff-consolidated.md` for project architecture and development context.

## Game Structure

**World Layout**

- Every continent is made up of 75-90 regions depending on the map
- A continent is the in-game term for a Zone, which is a single continuous map instance that players fight within. Most continents are 64km^2 in size
- Each region has exactly one facility, which players fight over. This is often informally referred to as a "base"
- "Facility" and "Region" have specific definitions to the game engine, but because there is always exactly a 1:1 relationship between facilities and regions the terms tend to be somewhat interchangeable

**Factions and Control**

- There are three primary factions: VS, NC, and TR
- Each region is controlled by a single faction
- Regions which are owned by the "None" faction are considered disabled
- The primary objective of each faction is to control as many facilities as possible

## Facility Capture Mechanics

**Capture Requirements**

- Each facility has a minimum amount of time it takes to capture under ideal circumstances
- The majority of facilities require at least 3 minutes to capture. This time depends on the type of the facility
- A facility is contested if an enemy faction has started the capture timer

## Territory Control System

**Warp Gates**

- Every continent has 3 warp gates, one controlled by each faction
- Warp gates cannot be captured by opposing factions
- Warp gates provide spawn logistics and supplies to connected regions

**Lattice Network**

- Regions are connected together via "lattice links", forming an undirected graph
- There exists a path from every region to each of the three warp gates, as well as between every pair of regions
- Each region has a lattice link to at least 2 neighboring regions
- Regions only have lattice links to geographic neighbors
- Being a geographic neighbor does not mean two facilities are linked
- Lattice links are considered disabled if either base at each end is owned by the faction "None"

**Territory Connectivity**

- A faction can only gain control of a facility if that faction controls an uncontested facility adjacent to it in the lattice
- A region is considered connected to its warp gate if there is a path to the warp gate of the controlling faction, where that faction controls every region in that path
- A region is "cut off" if there is no path to the faction warp gate where every region along the path is controlled by the owning faction
- Players cannot directly spawn in cutoff regions unless they are already inside that region

## Alert System

**Alert Mechanics**

- Periodically the game has in-game events known as "alerts". These are also referred to as metagame events
- Alerts have an objective and a time limit. At the end of the alert, the faction which is leading is declared the winner

**Territory Control Alerts**

- The objective of the primary type of alert is to control as many regions on the map as possible when the timer runs out
- Territory control alerts usually take 90 minutes
- Only connected regions count towards the final score in territory control alerts
- The winning faction of a territory control alert takes control of the entire continent.
