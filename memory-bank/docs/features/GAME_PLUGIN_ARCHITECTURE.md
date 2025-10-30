# Game Plugin Architecture

## Vision: Chinese Cultivation + Dwarf Fortress + Life Gamification

The ChayCards Game Plugin is a **Chinese cultivation-themed** simulation game that transforms all aspects of life tracking into engaging cultivation progression. Users advance through cultivation realms by completing real-world activities across multiple life domains - productivity, fitness, nutrition, mindfulness, etc.

## Core Game Mechanics

### Multi-Domain Life Tracking Integration
- **Data Sources**: Game consumes from multiple ChayCards plugins
  - `core.tasks` → Task completion, focus time, productivity
  - `core.habits` → Daily habits, streaks, consistency
  - `connector.fitness` → Exercise, steps, heart rate (via fitness APIs)
  - `connector.nutrition` → Meals, macros, hydration (via nutrition apps)
  - `connector.sleep` → Sleep quality, duration (via sleep trackers)
  - `connector.mindfulness` → Meditation, journaling (via meditation apps)

### Cultivation Progression System
- **Cultivation Realms**: Mortal → Qi Gathering → Foundation Building → Core Formation → Golden Core → Nascent Soul...
- **Core Stats**:
  - Spiritual Power (meditation, learning, mindfulness)
  - Physical Strength (exercise, nutrition, sleep)
  - Mental Clarity (task completion, focus time)
  - Social Harmony (relationships, social interactions)
- **Resources**:
  - Qi (daily habit completion)
  - Spiritual Stones (major achievements)
  - Techniques (unlocked through consistency)

### Real-World Activity → Game Progression
- **Time Advancement**: Real activities = game time progression
  - 30min meditation → 1 game hour + spiritual power
  - 2hr deep work → 4 game hours + mental clarity
  - Complete workout → 2 game hours + physical strength
- **Idle State**: Game pauses when no life activities tracked
- **Progression Buffs**: Better habits = faster cultivation advancement

## Technical Architecture

### Client-Server Architecture
```
ChayCards Task System ←→ Game Plugin ←→ Godot Headless Server
         ↓                    ↓                    ↓
    Task Events         Game Interface      Game Simulation
    Habit Tracking      Progress Display    Resource Calculation
    Time Tracking       Building Status     Event Generation
```

### Game Plugin Structure
```
src/plugins/game-fortress/
├── client/                    # React components
│   ├── GameCanvas.tsx        # Main game display (2D colony view)
│   ├── GameHUD.tsx          # Overlay UI (resources, time, alerts)
│   ├── TaskBridge.tsx       # Connects ChayCards tasks to game
│   ├── SettingsPanel.tsx    # Game configuration
│   └── components/          # Game-specific UI components
├── server-config/           # Godot server setup
│   ├── game-server.json    # Server configuration
│   └── default-settings.json
├── types/                   # Shared TypeScript definitions
│   ├── GameState.ts        # Game world state
│   ├── GameEvents.ts       # Event system types
│   └── TaskMapping.ts      # Task-to-game mappings
└── services/               # Game logic services
    ├── TaskGameBridge.ts   # Core integration logic
    ├── GameStateManager.ts # Local game state
    └── ServerConnection.ts # Godot server communication
```

### Plugin Data Integration Architecture

#### Multi-Plugin Data Consumption
```typescript
// Game plugin consumes from multiple data source plugins
manager.setService('cultivation-game/engine', new CultivationEngine())

// Data provider plugins register standardized services
manager.setService('fitness/tracker', new FitnessService())
manager.setService('nutrition/tracker', new NutritionService())
manager.setService('habits/tracker', new HabitService())
manager.setService('tasks/tracker', new TaskService())

// Game subscribes to all data sources
const gameService = manager.getService('cultivation-game/engine')
gameService.subscribeToDataFeeds([
  'fitness/tracker', 'nutrition/tracker',
  'habits/tracker', 'tasks/tracker'
])
```

#### Standardized Life Tracking Schema
```typescript
interface LifeTrackingData {
  category: 'physical' | 'mental' | 'spiritual' | 'social' | 'productive'
  subcategory: string
  value: number
  unit: string
  timestamp: Date
  source: string
  metadata?: Record<string, any>
}

// Real-time event conversion to cultivation mechanics
eventBus.on('life:activity', (data: LifeTrackingData) => {
  switch(data.category) {
    case 'spiritual': gameEngine.increaseStat('spiritualPower', data.value); break
    case 'physical': gameEngine.increaseStat('physicalStrength', data.value); break
    case 'productive': gameEngine.increaseStat('mentalClarity', data.value); break
  }
})
```

#### External Service Connectors (Non-UI Plugins)
```typescript
// Connector plugins translate external APIs to standard format
- connector.fitbit → Fitness data (steps, workouts, heart rate)
- connector.myfitnesspal → Nutrition (macros, meals, water intake)
- connector.headspace → Mindfulness (meditation sessions, mood)
- connector.strava → Exercise (runs, cycles, strength training)
- connector.oura → Recovery (sleep quality, HRV, readiness)
```

### Game Server (Godot) Architecture

#### Headless Server Features
- **No Rendering**: Pure simulation, UI handled by React
- **HTTP API**: RESTful endpoints for game state
- **WebSocket**: Real-time events and updates
- **Save System**: Persistent game state in SQLite
- **Modular Systems**: Economy, Population, Events, Buildings

#### API Design
```typescript
// REST API for game state
GET  /api/game/state          // Current game state
POST /api/game/events         // Send game events
GET  /api/game/resources      // Resource levels
GET  /api/game/buildings      // Building status

// WebSocket for real-time updates
gameServer.on('resource_changed', (data) => {
  updateGameUI(data)
})

gameServer.on('crisis_triggered', (data) => {
  showGameAlert(data)
})
```

## Game Design Principles

### Balanced Difficulty
- **No Punishment**: Game never punishes, only pauses progression
- **Positive Reinforcement**: Focus on rewards and growth
- **Manageable Complexity**: Start simple, unlock complexity through progression
- **Real Impact**: Game reflects actual productivity improvements

### Accessibility
- **Optional**: Can be disabled entirely
- **Configurable**: Adjust game speed, complexity, visual style
- **Mobile Friendly**: Works on all platforms via Capacitor
- **Low Resource**: Minimal impact on ChayCards performance

### Integration Philosophy
- **Seamless**: Feels like natural part of ChayCards
- **Non-Intrusive**: Doesn't interfere with productivity workflows
- **Contextual**: Game elements appear when relevant
- **Meaningful**: Every game element connects to real productivity

## Implementation Strategy

### Phase 1: Foundation (Week 1-2)
- Set up Godot headless server template
- Create basic game server API (REST + WebSocket)
- Build React game client components
- Implement task-to-game event mapping

### Phase 2: Core Loop (Week 3-4)
- Time progression system
- Resource generation from tasks
- Basic settlement view (2D colony display)
- Integration with ChayCards task system

### Phase 3: Depth (Week 5-6)
- Building system and unlocks
- Crisis/event system for neglected areas
- Advanced resource management
- Mobile optimization via Capacitor

### Phase 4: Polish (Week 7-8)
- Visual improvements and animations
- Sound integration (optional)
- Save/load system
- Settings and customization options

## Success Metrics

### Engagement
- Increased daily task completion rate
- Higher habit streak maintenance
- More consistent app usage patterns

### User Experience
- Seamless integration (users don't notice technical complexity)
- Performance impact < 5% on ChayCards
- Mobile experience equivalent to desktop

### Technical
- Game state synchronization < 100ms latency
- Stable server uptime (local and cloud)
- Clean plugin integration (no core system modifications)

This architecture positions the game plugin as a flagship example of ChayCards' plugin system capabilities while delivering genuine value through gamified productivity enhancement.