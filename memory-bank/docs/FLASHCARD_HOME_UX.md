# FlashcardHome UX Design - Final Specification

## Overview

This document defines the complete UX design for the FlashcardHome dashboard, which serves as the command center for flashcard learning in ChayCards. The design combines **Quizlet's simplicity** with **Anki's power** while integrating deeply with the Documents plugin folder system.

## Design Philosophy

### Two-Tab Layout: Focus + Library

The dashboard splits into two distinct modes:
- **Focus Tab**: Daily study workflow - "what should I study now?"
- **Library Tab**: Browse and organize - "how is everything organized?"

This separation prevents cognitive overload while providing both immediate action and deep organization.

---

## Tab 1: Focus (Daily Study Workflow)

### Purpose
Help users quickly start their daily study session with minimal friction.

### Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│  🧠 Flashcards               [Focus] [Library]             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📅 TODAY'S FOCUS                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Mode: [Combined ▼] [By Deck] [By Folder]             │ │
│  │ 142 cards due across 3 active decks                   │ │
│  │ ───────────────────────────────────────────────────── │ │
│  │                                                        │ │
│  │ [Mode-specific content - see below]                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  📊 ACTIVITY & STATS                  🔥 12 day streak    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [GitHub-style 52-week calendar with intensity]        │ │
│  │ Week: 347 cards · 2.3h studied · 89% correct         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  🎴 ALL DECKS                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [Search] [Sort: Recently ▼] [⭐ Active] [Simple ▼]   │ │
│  │ ───────────────────────────────────────────────────── │ │
│  │ ⭐ Spanish Verbs          87 due  [Study]            │ │
│  │    [▓▓▓▓▓▓▓▓░░] 234 cards · 87% mastery             │ │
│  │ ⭐ French Basics         55 due  [Study]             │ │
│  │    [▓▓▓▓▓▓▓░░░] 189 cards · 91% mastery             │ │
│  │ ...infinite scroll...                                 │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 1. Today's Focus Widget

#### Three Study Modes

**Mode 1: Combined (Default)**
```
┌────────────────────────────────────────┐
│ Study all 142 due cards together      │
│ Shuffled from all active decks        │
│                                        │
│ [🎯 Start Combined Study]             │
└────────────────────────────────────────┘
```
- One big button for immediate action
- All active decks' due cards combined
- Shuffled for interleaved learning

**Mode 2: By Deck**
```
┌────────────────────────────────────────┐
│ Show: [10 ▼] per page                 │
│                                        │
│ ⭐ Spanish Verbs     87 due  [Study]  │
│    [▓▓▓▓▓▓▓▓░░] 87% mastery          │
│ ⭐ French Basics    55 due  [Study]   │
│    [▓▓▓▓▓▓▓░░░] 91% mastery          │
│                                        │
│ [Page 1 of 1]                         │
└────────────────────────────────────────┘
```
- List of active decks with due cards
- User picks which to study first
- Paginated (5/10/20 per page dropdown)

**Mode 3: By Folder**
```
┌────────────────────────────────────────┐
│ 📁 Languages (142 due)    [Study]     │
│ 📁 Science (23 due)       [Study]     │
└────────────────────────────────────────┘
```
- Compact folder list (non-expandable)
- Only shows folders with active decks + due cards
- Click [Study] → combined session for all decks in folder (recursive)

**Mode Switching:**
- Dropdown persists user choice
- Saved to localStorage: `flashcards:focusMode`
- Content dynamically switches

### 2. Activity Heatmap

**GitHub-Style Calendar**
```
┌──────────────────────────────────────────────────┐
│ Jan  ░▓▓░░▓▓░░▓▓░░░░░▓▓▓░░░▓░                  │
│ Feb  ░░▓▓▓▓░░▓░░░░░░░░░░░░▓▓░░░░               │
│ ...52 weeks...                                   │
│      Less ░░ ░ ▓ █ More                         │
└──────────────────────────────────────────────────┘
```

**Color Logic:**
- **Base color by performance** (retention %):
  - 90-100%: Green
  - 75-89%: Yellow
  - 60-74%: Orange
  - <60%: Red
- **Intensity by card count** (darker = more cards studied):
  - 0 cards: Empty square
  - 1-10 cards: Light shade
  - 11-30 cards: Medium shade
  - 31-50 cards: Dark shade
  - 51+ cards: Darkest shade

**Interactions:**
- Hover → Tooltip: "March 15: 47 cards · 89% correct"
- Click → Detailed daily breakdown modal
- Streak counter: 🔥 12 days

**Stats Below:**
- This week: 347 cards · 2.3h studied · 89% correct

### 3. All Decks Section

**Header:**
```
[Search...] [Sort: Recently Studied ▼] [⭐ Active Only] [Simple ▼]
```

**Sort Options:**
- Recently studied (default)
- Most due
- Alphabetical (A-Z)
- Alphabetical (Z-A)
- Created date (newest first)
- Created date (oldest first)
- Retention % (struggling decks first)

**Filter Toggle:**
- [⭐ Active Only] - Yellow when enabled
- Click to toggle between all decks / active only

**View Toggle:**
- [Simple ▼] → Dropdown with "Simple" and "Rich"
- Persists to localStorage: `flashcards:deckViewMode`

**Deck Rows - Simple View:**
```
⭐ Spanish Verbs                    87 due  [Study]
   [▓▓▓▓▓▓▓▓░░] 234 cards · 87% mastery
```
- Star icon (if active, filled yellow)
- Deck name
- Due count badge (right side)
- Progress bar (10 segments)
- Total cards + mastery %
- [Study] button appears on hover

**Deck Rows - Rich View:**
```
⭐ Spanish Verbs                              [Study]
   [▓▓▓▓▓▓▓▓░░] 234 total | 42 new | 87 learning | 105 review
   87% retention · 87 due · Studied 2h ago
```
- All simple view content
- Plus: card breakdown (new/learning/review)
- Retention %
- Last studied timestamp
- [Study] button always visible (not on hover)

**Progress Bar:**
- 10 segments (visual blocks)
- Mastery % = (cards with interval > 21 days) / total cards
- Color:
  - 0-40%: Red (#ef4444)
  - 41-70%: Yellow (#f59e0b)
  - 71-100%: Green (#10b981)

**Scrolling:**
- Infinite scroll (no pagination)
- Loads 20 decks at a time
- Smooth scrolling experience

**Click Behavior:**
- Click anywhere on row → Opens DeckView
- Click [Study] button → Starts study session (stops propagation)
- Click star icon → Toggles active status (stops propagation)

---

## Tab 2: Library (Browse & Organize)

### Purpose
Provide hierarchical organization and folder-based study options.

### Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│  🧠 Flashcards               [Focus] [Library]             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📁 FOLDERS                                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [Search folders...] [+ New Folder]                    │ │
│  │ ───────────────────────────────────────────────────── │ │
│  │                                                        │ │
│  │ 📁 Languages          3 decks, 142 due  [Study] ⋮    │ │
│  │                       [▓▓▓▓▓▓▓▓░░] 87%               │ │
│  │    ├─ 🎴 Spanish Verbs    87 due                     │ │
│  │    │     [▓▓▓▓▓▓▓▓░░] 87%                           │ │
│  │    ├─ 🎴 French Basics    55 due                     │ │
│  │    │     [▓▓▓▓▓▓▓░░░] 91%                           │ │
│  │    └─ 📁 German (empty)                     [+] ⋮   │ │
│  │                                                        │ │
│  │ 📁 Science            1 deck, 23 due   [Study] ⋮     │ │
│  │                       [▓▓▓▓▓▓░░░░] 85%               │ │
│  │    └─ 🎴 Biology 101      23 due                     │ │
│  │          [▓▓▓▓▓▓░░░░] 85%                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  🎴 UNORGANIZED DECKS                                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Decks in root "Flashcards" folder                     │ │
│  │ 🎴 Quick Spanish Quiz   12 due         [Study]       │ │
│  │    [▓▓▓░░░░░░░] 30% mastery                          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  📊 STATISTICS                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Total: 7 decks (3 active) · 1,234 cards              │ │
│  │ Mastered: 456 (37%) · All-time retention: 87%        │ │
│  │ [View Detailed Statistics →]                         │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 1. Folder Tree (Expandable Fat Rows)

**Folder Row Design:**
```
📁 Languages          3 decks, 142 due  [Study] ⋮
                      [▓▓▓▓▓▓▓▓░░] 87%
```

**Components:**
- **Folder icon** (📁) - Uses color from Documents plugin (synced)
- **Folder name**
- **Aggregate stats**: "X decks, Y due"
- **Progress bar**: Average mastery across all descendant decks
- **[Study] button**: Appears on hover, studies all decks recursively
- **⋮ menu button**: Opens context menu

**Expanded State:**
```
📁 Languages          3 decks, 142 due  [Study] ⋮
                      [▓▓▓▓▓▓▓▓░░] 87%
   ├─ 🎴 Spanish Verbs    87 due
   │     [▓▓▓▓▓▓▓▓░░] 87%
   ├─ 🎴 French Basics    55 due
   │     [▓▓▓▓▓▓▓░░░] 91%
   └─ 📁 German (empty)                [+] ⋮
```

**Child Elements:**
- **Subfolders**: Indented, same style as parent, recursive
- **Decks**: Indented, show mini progress bar + due count
- **Indentation**: 24px per level
- **Tree lines**: Visual connectors (├─ └─)

**Hover Behavior:**
- Folder row → [Study] button appears
- Deck row → Clickable, opens DeckView

### 2. Context Menu (⋮ button)

**For Folders:**
```
⚡ Study All Decks (recursive)
───────────────
📁 New Subfolder
🎴 New Deck in Folder
✏️ Rename
🎨 Change Color
───────────────
🗑️ Delete Folder
```

**For Decks:**
```
⚡ Study Now
📝 Edit Cards
⭐ Toggle Active
───────────────
🗑️ Delete Deck
```

**Context Menu Behavior:**
- Appears on right-click or click ⋮
- Modal overlay (click outside to close)
- Actions close menu on completion

### 3. Folder Color System

**Color Sync with Documents Plugin:**
- Folders created in Flashcards → color visible in Documents
- Folders created in Documents → color visible in Flashcards
- Color stored in folder metadata (shared)
- Color picker uses Documents plugin's palette

**Default Colors:**
- User-assigned colors take priority
- If no color set, auto-assign based on mastery:
  - 90-100%: Green
  - 75-89%: Blue
  - 60-74%: Yellow
  - <60%: Red

**Change Color Dialog:**
```
┌─────────────────────────────┐
│ Change Folder Color         │
├─────────────────────────────┤
│ [● Red] [○ Orange] [○ Yellow]│
│ [○ Green] [○ Blue] [○ Purple]│
│ [○ Gray] [○ Custom]          │
│                             │
│ [Cancel] [Save]             │
└─────────────────────────────┘
```

### 4. Folder Deletion Logic

**Safety Checks:**

**Case 1: Empty folder**
```typescript
// Delete immediately, no confirmation
await documentsService.deleteFolder(folderId, false);
toast.success('Folder deleted');
```

**Case 2: Contains only flashcard decks**
```typescript
// Show confirmation with counts
const confirmed = await confirm(
  `Delete "Languages" with 3 decks (247 cards)?`,
  'This cannot be undone.'
);

if (confirmed) {
  await documentsService.deleteFolder(folderId, true); // deleteContents=true
  toast.success('Folder and decks deleted');
}
```

**Case 3: Contains non-flashcard files or mixed content**
```typescript
// Block deletion
alert(
  'Cannot delete folder',
  'This folder contains non-flashcard files. ' +
  'Please delete or move them first.'
);
```

**Implementation:**
Uses `documentsService.getFolderContents(folderId, recursive=true)` helper to analyze contents before deletion.

### 5. Folder Actions (Quick Add Buttons)

**[+] Button on Folders:**
- Appears on hover next to folder name
- Opens quick menu:
  ```
  📁 New Subfolder
  🎴 New Deck in this Folder
  ```
- Creates with default name, opens inline edit

**[+ New Folder] Button (Top Right):**
- Opens dialog:
  ```
  ┌─────────────────────────┐
  │ Create Folder           │
  ├─────────────────────────┤
  │ Name: [_____________]   │
  │ Parent: [Root ▼]        │
  │ Color: [Blue ○]         │
  │                         │
  │ [Cancel] [Create]       │
  └─────────────────────────┘
  ```

### 6. Unorganized Decks Section

**Purpose:**
Show decks not in any folder (or in root "Flashcards" folder).

**Display:**
```
🎴 UNORGANIZED DECKS
Decks in root "Flashcards" folder

🎴 Quick Spanish Quiz   12 due         [Study]
   [▓▓▓░░░░░░░] 30% mastery
```

**Behavior:**
- Auto-shows when decks exist at root level
- Hidden if all decks are organized in folders
- Allows drag-drop to folders (future enhancement)

---

## Shared Components

### 1. Deck Row Component

**Props:**
```typescript
interface DeckRowProps {
  deck: Deck;
  dueCount: number;
  viewMode: 'simple' | 'rich';
  onStudy: () => void;
  onView: () => void;
  onToggleStar: () => void;
}
```

**Features:**
- Reused in Focus tab (All Decks) and Library tab (folder children)
- Adapts to viewMode prop
- Star icon toggles active status
- Progress bar with color coding
- Hover reveals [Study] button (simple mode)

### 2. Progress Bar Component

**Props:**
```typescript
interface ProgressBarProps {
  mastery: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Rendering:**
```typescript
// 10 segments
const filled = Math.floor(mastery / 10);
const color = mastery >= 71 ? 'green' : mastery >= 41 ? 'yellow' : 'red';

// Output: [▓▓▓▓▓▓▓▓░░]
```

### 3. Study Mode Picker Component

**Used in:**
- Today's Focus widget (Focus tab)
- Folder context menu (Library tab)
- Deck settings (future)

**Component:**
```typescript
<Select value={studyMode} onValueChange={setStudyMode}>
  <SelectItem value="spaced-repetition">Spaced Repetition</SelectItem>
  <SelectItem value="classic">Classic Review</SelectItem>
  <SelectItem value="shuffle">Shuffle</SelectItem>
  <SelectItem value="cram">Cram Mode</SelectItem>
</Select>
```

---

## Data Flow & State Management

### 1. Custom Hooks

```typescript
// Flashcard data
const { decks, loading, error } = useFlashcards(service);

// Documents folder integration
const { folders } = useFolders(documentsService);

// Due card counts per deck
const dueCards = useDueCards(decks);

// Folder tree with deck aggregation
const folderTree = useFolderTree(folders, decks, dueCards);

// Persistent user preferences
const [focusMode, setFocusMode] = usePersistentState('flashcards:focusMode', 'combined');
const [sortMode, setSortMode] = usePersistentState('flashcards:sortMode', 'recently-studied');
const [filterActive, setFilterActive] = usePersistentState('flashcards:filterActive', false);
const [viewMode, setViewMode] = usePersistentState('flashcards:deckViewMode', 'simple');
const [focusPageSize, setFocusPageSize] = usePersistentState('flashcards:focusPageSize', 10);
```

### 2. Folder Tree Building

```typescript
interface EnrichedFolderNode extends Folder {
  children: EnrichedFolderNode[];
  decks: Deck[];
  stats: FolderStats;
  isExpanded: boolean;
}

interface FolderStats {
  totalDecks: number;
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueToday: number;
  masteredCards: number;
  averageRetention: number;
  averageEase: number;
}

// Build tree recursively
function buildFolderTree(
  folders: Folder[],
  decks: Deck[],
  dueCardsCount: Record<string, number>
): EnrichedFolderNode[] {
  // ... recursive tree building with aggregate stats
}
```

### 3. Filter Logic

**Flashcard-Only Folders:**
```typescript
// Only render folders that contain flashcard decks (anywhere in tree)
function hasFlashcardDecks(folder: EnrichedFolderNode): boolean {
  // Direct decks
  if (folder.decks.length > 0) return true;

  // Recursive check children
  return folder.children.some(hasFlashcardDecks);
}

const flashcardFolders = folderTree.filter(hasFlashcardDecks);
```

**Active Deck Filter:**
```typescript
const visibleDecks = filterActive
  ? decks.filter(d => d.isActive)
  : decks;
```

**Sort Logic:**
```typescript
function sortDecks(decks: Deck[], mode: SortMode): Deck[] {
  switch (mode) {
    case 'recently-studied':
      return [...decks].sort((a, b) =>
        b.stats.lastStudied - a.stats.lastStudied
      );
    case 'most-due':
      return [...decks].sort((a, b) =>
        dueCardsCount[b.id] - dueCardsCount[a.id]
      );
    case 'alphabetical-az':
      return [...decks].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    // ... other sort modes
  }
}
```

---

## Documents Service API Updates

### New Helper Method Needed

```typescript
/**
 * Analyze folder contents for plugin-specific filtering and safety checks
 */
async getFolderContents(
  folderId: string,
  recursive = true
): Promise<{
  isEmpty: boolean;
  folders: Folder[];
  filesByHandler: Record<string, StoredFile[]>;
  totalFiles: number;
}>;
```

**Usage in Flashcards:**

```typescript
// Check if folder only contains flashcard decks
const contents = await documentsService.getFolderContents(folderId, true);

const hasDecks = contents.filesByHandler['flashcard-deck-handler']?.length > 0;
const hasOtherFiles = Object.keys(contents.filesByHandler).some(
  handler => handler !== 'flashcard-deck-handler' &&
             contents.filesByHandler[handler].length > 0
);

// Safe to delete if only flashcard decks
const safeToDelete = !hasOtherFiles && !contents.isEmpty;
```

---

## Persistence

### localStorage Keys

```typescript
// User preferences (persisted)
'flashcards:focusMode'         → 'combined' | 'by-deck' | 'by-folder'
'flashcards:sortMode'          → 'recently-studied' | 'most-due' | 'alphabetical' | ...
'flashcards:filterActive'      → 'true' | 'false'
'flashcards:deckViewMode'      → 'simple' | 'rich'
'flashcards:focusPageSize'     → '5' | '10' | '20'
'flashcards:expandedFolders'   → JSON.stringify(Set<string>)
```

### Sync with Backend (Future)

When user has account:
- Sync preferences across devices
- Store in user settings table
- Merge local + remote on login

---

## Empty States

### No Decks Exist
```
🎴 No Decks Yet
Create your first deck to start learning!
[+ Create Deck]
```

### No Due Cards (Focus Tab)
```
🎉 All Caught Up!
You have no cards due today. Great job!
Come back tomorrow or browse all decks below.
```

### No Active Decks
```
⭐ No Active Decks
Star decks to add them to Today's Focus
[Browse All Decks ↓]
```

### Folder Empty (Library Tab)
```
📁 Languages (empty)
   Create decks in this folder to start organizing
   [+ New Deck in Folder]
```

### No Folders with Flashcards
```
📁 No Flashcard Folders Yet
   All your decks are in the root folder
   [+ Create Folder] to start organizing
```

---

## Interactions & Animations

### Hover States
- **Deck row**: Background changes to accent color, [Study] button fades in (simple mode)
- **Folder row**: Background changes, [Study] button appears
- **Progress bar**: Tooltip shows exact percentage

### Click Actions
- **Deck row**: Navigate to DeckView (unless clicking button/star)
- **Star icon**: Toggle active status, icon fills/unfills with animation
- **[Study] button**: Start study session, prevent row click propagation
- **Folder row**: Toggle expand/collapse
- **Context menu (⋮)**: Open menu, click outside to close

### Loading States
- **Initial load**: Skeleton loaders for deck rows and folders
- **Infinite scroll**: Loading spinner at bottom of All Decks list
- **Study button**: Disabled state while session loads

### Transitions
- **Tab switching**: Fade transition (200ms)
- **Folder expand/collapse**: Slide-down animation (300ms)
- **Star toggle**: Scale + color change (200ms)
- **Progress bar fill**: Animate width change (400ms ease-out)

---

## Responsive Design

### Mobile Adaptations (Future)
- **Focus tab**: Stack Today's Focus above Activity Heatmap
- **Deck rows**: Single column, touch-friendly buttons
- **Context menu**: Bottom sheet instead of dropdown
- **Folder tree**: Collapsible accordion style

### Desktop Optimizations
- **Wide screens**: Two-column layout for "By Deck" mode in Today's Focus
- **Sidebar option**: Optional persistent folder tree sidebar (future)
- **Keyboard shortcuts**: Arrow keys for navigation, Enter to study

---

## Performance Considerations

### Virtualization
- **All Decks infinite scroll**: Only render visible rows + buffer
- **Large folder trees**: Virtual scrolling for 100+ folders

### Caching
- **Due card counts**: Cache for 5 minutes, refresh on study completion
- **Folder tree**: Rebuild only when folders/decks change
- **Progress bar calculations**: Memoize expensive mastery calculations

### Optimistic Updates
- **Star toggle**: Update UI immediately, sync in background
- **Folder expand**: Instant UI change, no async wait

---

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through interactive elements
- **Enter**: Activate focused button/link
- **Arrow keys**: Navigate deck list (future enhancement)
- **Escape**: Close modals and context menus

### Screen Readers
- **Semantic HTML**: Proper heading hierarchy (h1, h2, h3)
- **ARIA labels**: All interactive elements labeled
- **Progress bars**: aria-valuenow, aria-valuemin, aria-valuemax
- **Context menus**: aria-haspopup, role="menu"

### Color Contrast
- **WCAG AA compliance**: All text meets 4.5:1 contrast ratio
- **Progress bars**: Not only color-dependent (also use shading/patterns)
- **Focus indicators**: Visible keyboard focus outlines

---

## Implementation Priority

### Phase 1: Core Structure (Current)
1. Two-tab layout (Focus + Library)
2. Today's Focus widget with 3 modes
3. All Decks section with simple/rich toggle
4. Folder tree with expand/collapse
5. Deck row component (reusable)
6. Progress bar component

### Phase 2: Integration
1. Documents API `getFolderContents` helper
2. Folder safety checks for deletion
3. Folder color sync with Documents
4. Context menus (folders + decks)
5. Folder CRUD operations

### Phase 3: Polish
1. Activity heatmap component
2. Infinite scroll for All Decks
3. Empty states
4. Loading skeletons
5. Animations and transitions

### Phase 4: Study Modes (Future)
1. Combined study session (multi-deck)
2. Folder study session (recursive)
3. Study mode picker before session starts
4. Progress tracking during study

---

## Success Metrics

### UX Goals
- **Time to first study**: < 3 clicks from opening app
- **Deck discovery**: Users find decks via folders 80% of the time
- **Active deck usage**: 70%+ of users star at least 1 deck
- **Daily return rate**: 60%+ users return next day

### Technical Goals
- **Initial render**: < 500ms for 100 decks
- **Folder tree build**: < 100ms for 50 folders
- **Scroll performance**: 60fps with 500+ decks
- **Memory usage**: < 100MB for full dashboard

---

## Future Enhancements

### Phase 5+
- **Drag-drop deck reordering**: Drag decks into folders
- **Bulk actions**: Select multiple decks, apply actions
- **Advanced filters**: By tag, date range, retention %
- **Custom dashboard layouts**: User-configurable sections
- **Keyboard shortcuts**: Power user navigation
- **Mobile gestures**: Swipe to study, pinch to zoom heatmap

---

## Summary

This UX design provides:

✅ **Clear separation**: Focus (study now) vs Library (organize)
✅ **Folder integration**: Deep sync with Documents plugin
✅ **Flexible study modes**: Combined, by deck, by folder
✅ **Motivation built-in**: Activity heatmap, streaks, progress bars
✅ **Scalability**: Handles 5 decks or 500 decks
✅ **Progressive disclosure**: Simple by default, rich when needed
✅ **Folder safety**: Smart deletion checks prevent data loss
✅ **Color consistency**: Folders match across plugins

The design balances **Quizlet's simplicity** (immediate study actions) with **Anki's organization** (hierarchical structure), creating a flashcard home that adapts to both casual learners and power users.
