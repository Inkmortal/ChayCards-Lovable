# Game Plugin Architecture

## Vision: Dwarf Fortress Meets Productivity

The ChayCards Game Plugin transforms task and habit tracking into an engaging simulation game where completing real-world tasks drives in-game time progression and colony development.

## Core Game Mechanics

### Time-Based Progression System
- **Game Time = Task Completion Time**
  - Complete a 2-hour work task → Game advances 2 hours
  - Check off daily habits → Game advances 1 day
  - Finish long-term projects → Seasonal progression
- **Idle State**: Game pauses when no tasks are being worked on
- **Task Types Affect Game Speed**:
  - Focus tasks: 1:1 time ratio
  - Maintenance tasks: 2:1 ratio (2 hours real = 1 hour game)
  - Learning tasks: 1:2 ratio (accelerated game time)

### Colony/Settlement Simulation
- **Dwarf Fortress Style**: Manage a small settlement/colony
- **Citizens**: Each represents a life area (work, health, learning, relationships)
- **Resources**: Generated through task completion
  - Work tasks → Gold/Materials
  - Health tasks → Food/Medicine
  - Learning tasks → Knowledge/Technology
  - Social tasks → Happiness/Culture

### Gamification Elements
- **Buildings**: Unlock through consistent habit completion
  - Workshop (work habits) → Productivity bonuses
  - Library (learning habits) → Skill development
  - Garden (health habits) → Well-being bonuses
- **Seasons/Events**: Long-term goal achievement triggers major events
- **Crisis Management**: Neglected areas create challenges requiring attention

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

### Integration with ChayCards Plugin System

#### Component Registration
```typescript
// Game plugin registers multiple components across different regions
manager.setComponent('fortress.main/GameView', GameCanvas)
manager.setComponent('fortress.sidebar/GamePanel', GameHUD)
manager.setComponent('fortress.header/GameStatus', StatusBar)

// Enhances existing task components
const OriginalTaskCard = manager.getComponent('core.tasks/TaskCard')
const GameTaskCard = (props) => (
  <div>
    <GameTaskRewards taskId={props.id} />
    <OriginalTaskCard {...props} />
  </div>
)
manager.setComponent('core.tasks/TaskCard', GameTaskCard)
```

#### Event Bus Integration
```typescript
// Listen for task events and convert to game events
eventBus.on('task:completed', (event) => {
  const gameEvent = mapTaskToGameEvent(event)
  gameServer.sendEvent(gameEvent)
})

eventBus.on('habit:streak-broken', (event) => {
  gameServer.sendEvent({
    type: 'CRISIS',
    area: mapHabitToGameArea(event.habitType),
    severity: calculateSeverity(event.streakLength)
  })
})
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