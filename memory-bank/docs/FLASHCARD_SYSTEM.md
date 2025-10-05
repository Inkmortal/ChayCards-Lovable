# Flashcard System Specification

## Vision: The Best of Both Worlds

**ChayCards Flashcards = Quizlet's UX + Anki's Power**

We're building a flashcard system that doesn't compromise. Users get:
- **Quizlet-level simplicity**: Beautiful, intuitive interface for quick flashcard creation
- **Anki-level flexibility**: Deep customization, HTML templates, advanced spaced repetition
- **Progressive disclosure**: Simple by default, powerful when needed

### Scope: Flashcards = Individual Study
Flashcards are for **personal learning and review** via spaced repetition. Each card is a single question/answer for active recall.

**What Flashcards ARE:**
- Individual Q&A pairs for memorization
- Spaced repetition study sessions
- Self-paced learning and review
- Knowledge reinforcement

**What Flashcards are NOT (those go in other plugins):**
- ❌ Formal tests/quizzes with scoring (→ Documents/Quizzes plugin)
- ❌ Multi-question assessments (→ Test/Exam plugin)
- ❌ Graded assignments (→ Documents plugin)
- ❌ Complex interactive simulations (→ separate plugin)

## Design Philosophy

### Layer 1: Instant Productivity (Quizlet Experience)
Users can create flashcards in seconds without configuration:
- **99% use premade templates** (Basic, Language, Medical, Code, etc.)
- **Import from Anki/Quizlet** (millions of existing decks)
- Click "New Deck" → Choose template → Start adding cards
- Beautiful out of the box
- Zero learning curve
- **No competitors** can match this ease + power combo

### Layer 2: Power User Features (Anki Experience)
When users need more:
- Custom HTML templates with live preview
- Theme variable autocomplete
- Advanced spaced repetition algorithms
- Per-deck and global settings
- Import/export (Anki .apkg, Quizlet text, CSV)

### Layer 3: Developer Extensibility
For the ambitious:
- JavaScript in templates
- Custom algorithms via plugins
- API for third-party integrations

## Flashcard Home & Organization

### Home Screen

The flashcard home screen is command central for your learning:

```
┌───────────────────────────────────────────────────────────────┐
│ Flashcards                    [🔍 Search] [Import] [+ New]    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ 🎯 Today's Focus                        [Customize]           │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Due Today: 47 cards                  [Study Mode ▼]     │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 34/47         │   │
│ │                                                         │   │
│ │ 🇪🇸 Spanish (23) • 💻 JavaScript (15) • 🧬 Biology (9) │   │
│ │                                                         │   │
│ │ [Start Review: All 47 Cards]                            │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ 📊 Your Progress                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│ │ 🔥 Streak    │ │ 📈 Total     │ │ ⭐ Mastered  │           │
│ │   28 days    │ │ 1,247 cards  │ │   823 cards  │           │
│ └──────────────┘ └──────────────┘ └──────────────┘           │
│                                                               │
│ Activity (GitHub-style heatmap)                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Jan  ░▓▓░░▓▓░░▓▓░░░░░▓▓▓░░░▓░                          │   │
│ │ Feb  ░░▓▓▓▓░░▓░░░░░░░░░░░░▓▓░░░░                       │   │
│ │ Mar  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                     │   │
│ │      Less ░░ ░ ▓ █ More                                │   │
│ └─────────────────────────────────────────────────────────┘   │
│ Hover: "March 15: 47 cards reviewed" • Click: See details    │
│                                                               │
│ Active Decks (⭐)                            [Manage Active]  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ⭐ 🇪🇸 Spanish Verbs              23 due   [Study]       │   │
│ │ ⭐ 💻 JavaScript Basics            15 due   [Study]       │   │
│ │ ⭐ 🧬 Cell Biology                9 due    [Study]       │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ All Decks & Folders                          [Grid] [List]   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│ │ 📁 Languages│ │ 📁 CS Degree│ │ 📁 Medical  │             │
│ │   3 decks   │ │   7 decks   │ │   5 decks   │             │
│ │   156 due   │ │   89 due    │ │   42 due    │             │
│ └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                               │
│ Recent Activity                                               │
│ • Studied Spanish Verbs (23 cards) - 2 hours ago             │
│ • Added 15 cards to JavaScript Basics - Yesterday            │
│ • Imported Anatomy deck from Anki - 2 days ago               │
└───────────────────────────────────────────────────────────────┘
```

### Key Features

#### 1. Today's Focus (Smart Dashboard with Flexible Study Modes)

**Three Study Mode Options:**

Users can choose how to tackle their due cards via the **[Study Mode ▼]** dropdown:

##### Mode 1: Combined (Default - Most Efficient)
```
┌─────────────────────────────────────────────────┐
│ Study Mode: ● Combined                          │
├─────────────────────────────────────────────────┤
│ Study all 47 due cards as one deck             │
│ • Shuffled together from all active decks      │
│ • Most efficient (one session)                 │
│ • Smart spacing mixes topics                   │
│                                                 │
│ [Start Review: All 47 Cards]                    │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- Knock out all reviews in one go
- Interleaved learning (Spanish → JS → Biology → Spanish...)
- Most time-efficient

##### Mode 2: By Deck (Focused Study)
```
┌─────────────────────────────────────────────────┐
│ Study Mode: ● By Deck                           │
├─────────────────────────────────────────────────┤
│ Study one deck at a time, choose which first:   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🇪🇸 Spanish Verbs          [Study 23 →]  │   │
│ │ 💻 JavaScript Basics       [Study 15 →]  │   │
│ │ 🧬 Cell Biology            [Study 9 →]   │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- Focus on one subject at a time
- Complete a deck before moving on
- Good for deep concentration
- Choose order based on priority/mood

##### Mode 3: By Folder (Subject-Organized)
```
┌─────────────────────────────────────────────────┐
│ Study Mode: ● By Folder                         │
├─────────────────────────────────────────────────┤
│ Study by folder, choose which first:            │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 📁 Languages (23 cards)    [Study →]     │   │
│ │    🇪🇸 Spanish Verbs (23)                │   │
│ │                                          │   │
│ │ 📁 CS Courses (15 cards)   [Study →]     │   │
│ │    💻 JavaScript Basics (15)             │   │
│ │                                          │   │
│ │ 📁 Sciences (9 cards)      [Study →]     │   │
│ │    🧬 Cell Biology (9)                   │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Each folder studied as combined deck            │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- Organized by subject area
- Good for students (study by course)
- Folder = all related decks together
- Natural mental grouping

---

### Study Mode Persistence & Customization

**Remembers Your Preference:**
```
Settings → Today's Focus → Default Study Mode
● Combined (recommended)
○ By Deck
○ By Folder

☑ Remember my choice
☐ Always ask before starting
```

**Quick Toggle:**
- Dropdown in "Today's Focus" widget
- Switches modes instantly
- Shows appropriate UI for selected mode

**Smart Defaults:**
```
If you have:
- 1 active deck → Direct "Start Review" button
- 2-3 active decks → Defaults to "Combined"
- 4+ active decks → Suggests "By Folder" if organized
- Many folders → Defaults to "By Folder"
```

### Example Workflows

#### Student: "By Folder" Mode
```
Sarah has 6 active decks across 3 courses:

📁 Biology 101
  - Cell Structure (12 due)
  - Photosynthesis (8 due)

📁 Chemistry 101
  - Periodic Table (15 due)
  - Chemical Bonds (7 due)

📁 Calculus I
  - Derivatives (18 due)
  - Integrals (9 due)

She studies: Biology → Chemistry → Calculus
Each folder combines its decks for that subject
```

#### Language Learner: "Combined" Mode
```
José has 3 active Spanish decks:

🇪🇸 Spanish Verbs (23 due)
🇪🇸 Spanish Vocab (15 due)
🇪🇸 Spanish Grammar (9 due)

He studies all 47 cards together (interleaved)
Helps reinforce connections between topics
```

#### Power User: "By Deck" Mode
```
Alex picks exactly what to review:

Morning: JavaScript Basics (focused, fresh mind)
Afternoon: Spanish Verbs (language learning)
Evening: Cell Biology (before bed review)

Full control over order and timing
```

#### 2. GitHub-Style Activity Heatmap
```
Visual motivation system:
- Green intensity = cards reviewed that day
- Hover shows exact count
- Click day → detailed breakdown
- Streaks highlighted
- Encourages daily habit formation

Gamification:
- 🔥 Streak counter (consecutive days)
- 🏆 Achievements (7-day streak, 30-day streak, etc.)
- 📊 Weekly/monthly stats
```

#### 3. Active Decks (⭐ Priority Focus)
```
Users can star decks as "Active":
- Shows at top of home screen
- Included in "Today's Focus" review
- Quick access for current priorities
- Example: Student stars only current semester courses

Benefits:
- Focus on what matters now
- Ignore old/paused decks
- Flexible priority management
```

### Deck & Folder Organization

#### Hierarchical Structure
```
📚 My Flashcards
├── 📁 Languages
│   ├── 🇪🇸 Spanish
│   │   ├── ⭐ Verbs (Active)
│   │   ├── Vocabulary
│   │   └── Grammar
│   ├── 🇫🇷 French
│   │   ├── ⭐ Common Phrases (Active)
│   │   └── Pronunciation
│   └── 🇩🇪 German
│       └── Basics
├── 📁 Computer Science
│   ├── 💻 Algorithms
│   ├── 🔐 Security
│   └── 🗄️ Databases
└── 📁 Medical School
    ├── ⭐ Anatomy (Active)
    ├── Pharmacology
    └── Pathology
```

#### Folder Management UI
```
┌───────────────────────────────────────────────────┐
│ Languages                         [⚙️] [+ Add Deck]│
├───────────────────────────────────────────────────┤
│ 📊 Folder Stats                                   │
│ • 3 decks, 456 cards                              │
│ • 156 due today                                   │
│ • 87% average retention                           │
│                                                   │
│ Quick Actions                                     │
│ ☐ Mark entire folder as Active                   │
│ [Study Folder as Combined Deck]                   │
│                                                   │
│ Decks in this folder:                             │
│ ┌───────────────────────────────────────────────┐ │
│ │ ⭐ 🇪🇸 Spanish Verbs         156 cards  [⋮]   │ │
│ │    Due: 23 • Mastered: 89                     │ │
│ │                                               │ │
│ │ 🇫🇷 French Phrases           142 cards  [⋮]   │ │
│ │    Due: 15 • Mastered: 98                     │ │
│ │                                               │ │
│ │ 🇩🇪 German Basics            158 cards  [⋮]   │ │
│ │    Due: 12 • Mastered: 76                     │ │
│ └───────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

#### Study Folder as Deck (Killer Feature!)

Users can study an entire folder as if it were one combined deck:

```
┌─────────────────────────────────────────────────┐
│ Study Folder: Languages                         │
├─────────────────────────────────────────────────┤
│ Combine cards from:                             │
│ ☑ Spanish Verbs (156 cards)                     │
│ ☑ French Phrases (142 cards)                    │
│ ☑ German Basics (158 cards)                     │
│                                                 │
│ Total: 456 cards, 50 due                        │
│                                                 │
│ Study Mode:                                     │
│ ● Spaced Repetition (smart scheduling)          │
│ ○ Shuffle All (random mix)                      │
│ ○ By Deck (Spanish → French → German)           │
│                                                 │
│ [Start Combined Review]                         │
└─────────────────────────────────────────────────┘

Benefits:
- Review entire subject at once
- Mix related topics (Spanish + French vocab)
- Test knowledge across domains
- Efficient bulk review
```

### Deck View (Individual Deck)

```
┌───────────────────────────────────────────────────────────┐
│ 🇪🇸 Spanish Verbs                   [⭐ Active] [⚙️ Edit] │
├───────────────────────────────────────────────────────────┤
│ 📊 Deck Stats                                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │ 156 Cards  │ │  23 Due    │ │ 89 Mastered│             │
│ └────────────┘ └────────────┘ └────────────┘             │
│                                                           │
│ Activity (Last 30 days)                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │    50 ┤     ▄                                       │   │
│ │    40 ┤   ▄ █ ▄                                     │   │
│ │    30 ┤ ▄ █ █ █   ▄                                 │   │
│ │    20 ┤ █ █ █ █ ▄ █ ▄                               │   │
│ │    10 ┤ █ █ █ █ █ █ █                               │   │
│ │     0 └─────────────────────────────────            │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ How would you like to study?                             │
│ [Spaced Repetition] [Shuffle] [Cram] [Match] [More...]  │
│                                                           │
│ Recent Cards (Last edited)                                │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ser → to be                              [Edit] [📌]│   │
│ │ estar → to be (state/location)           [Edit] [📌]│   │
│ │ ir → to go                               [Edit] [📌]│   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ [+ Add Card]  [Bulk Add]  [Import]                       │
└───────────────────────────────────────────────────────────┘
```

### Active Deck Management

#### Mark/Unmark Decks as Active
```
Right-click deck → "⭐ Mark as Active"
Or: Deck settings → "☑ Show in Today's Focus"

Active decks:
- Appear in home screen "Active Decks"
- Included in "Today's Focus" aggregation
- Prioritized in review scheduling
- Highlighted in folder views

Use cases:
- Student: Star current semester courses only
- Language learner: Star language actively studying
- Med student: Star only current rotation topics
```

#### Bulk Active Management
```
┌─────────────────────────────────────────────────┐
│ Manage Active Decks                      [Save] │
├─────────────────────────────────────────────────┤
│ Active (3):                                     │
│ ☑ Spanish Verbs                                 │
│ ☑ JavaScript Basics                             │
│ ☑ Cell Biology                                  │
│                                                 │
│ Inactive (9):                                   │
│ ☐ French Phrases                                │
│ ☐ German Basics                                 │
│ ☐ Python Advanced                               │
│ ☐ Organic Chemistry                             │
│ [... 5 more]                                    │
│                                                 │
│ Quick Actions:                                  │
│ • [Activate All in "Medical School" folder]     │
│ • [Deactivate All in "Completed Courses"]       │
└─────────────────────────────────────────────────┘
```

### Statistics & Analytics Dashboard

```
┌───────────────────────────────────────────────────────────┐
│ Statistics                               [This Month ▼]   │
├───────────────────────────────────────────────────────────┤
│ Overview                                                  │
│ • Cards studied: 1,247                                    │
│ • Study time: 18h 42m                                     │
│ • Average retention: 87%                                  │
│ • Streak: 🔥 28 days                                      │
│                                                           │
│ Performance by Deck                                       │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Spanish Verbs        89% ━━━━━━━━━░░                │   │
│ │ JavaScript Basics    76% ━━━━━━━░░░░                │   │
│ │ Cell Biology         92% ━━━━━━━━━━░                │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ Study Time Distribution                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Mon ████████ 42 min                                  │   │
│ │ Tue ██████ 28 min                                    │   │
│ │ Wed ████████████ 67 min                              │   │
│ │ Thu ████ 18 min                                      │   │
│ │ Fri ██████████ 51 min                                │   │
│ │ Sat ░░░░ 0 min                                       │   │
│ │ Sun ████████ 39 min                                  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ Achievements 🏆                                           │
│ ✅ First Week Streak                                     │
│ ✅ 100 Cards Mastered                                    │
│ ✅ 7-Day Streak                                          │
│ 🔒 30-Day Streak (18 days to go!)                       │
│ 🔒 1000 Cards Mastered (177 to go!)                     │
└───────────────────────────────────────────────────────────┘
```

---

## Card Types & Templates

### Default Templates (Quizlet-Style Simplicity)

#### 1. Basic (Front/Back)
**Use Case**: Traditional flashcards
```
Front: "What is the capital of France?"
Back: "Paris"
```

#### 2. Cloze (Fill-in-the-Blank)
**Use Case**: Context-based learning
```
Template: "The {{c1::mitochondria}} is the powerhouse of the {{c2::cell}}."
Card 1: "The [...] is the powerhouse of the cell."
Card 2: "The mitochondria is the powerhouse of the [...]."
```

#### 3. Input (Type Answer)
**Use Case**: Active recall with typing
```
Front: "Translate: Hello"
Expected: "Hola"
Accepts: "hola", "Hola" (case-insensitive)
```

#### 4. Input with Checking
**Use Case**: Strict answer validation
```
Front: "What is 2 + 2?"
Expected: "4"
Accepts: "4" (exact match)
Rejects: "four", "Four"
```

#### 5. Image Occlusion (Masked Image)
**Use Case**: Visual learning (anatomy, geography, diagrams)
```
- Upload image
- Draw rectangles over parts to hide
- Click "Generate Cards"
- Auto-creates cards revealing one part at a time
```

#### 6. Audio Card
**Use Case**: Language learning, music
```
Front: [Audio clip plays]
Back: "Transcript or translation"
```

#### 7. Reverse Card (Auto-Generated)
**Use Case**: Bidirectional learning
```
Original: "English: Hello → Spanish: Hola"
Reverse: "Spanish: Hola → English: Hello"
```

#### 8. List/Bullet Points
**Use Case**: Remember multiple items, steps, or components
```
Front: "List 3 causes of the American Revolution"
Back:
  • Taxation without representation
  • British military occupation
  • Restrictions on colonial trade

Features:
  - Self-check: did I remember all items?
  - Progressive reveal (show one item at a time)
  - Reorder list items randomly
```

#### 9. Diagram (Image + Labels)
**Use Case**: Visual learning with labeled components
```
Front: [Image of heart anatomy]
Back: Same image with labels revealed
  - Aorta
  - Left ventricle
  - Right atrium
  - Pulmonary artery

Features:
  - Toggle labels on/off
  - Click to reveal individual labels
  - Combine with image occlusion
```

#### 10. Formula/Equation
**Use Case**: Math, physics, chemistry formulas
```
Front: "Pythagorean theorem"
Back: a² + b² = c²

Features:
  - LaTeX rendering
  - Variable definitions
  - Example calculations
  - Unit conversions
```

#### 11. Pronunciation (Audio + Text)
**Use Case**: Language learning, phonetics
```
Front: "How do you say 'hello' in Japanese?"
Back:
  Text: こんにちは (Konnichiwa)
  Audio: [Play pronunciation]

Features:
  - Record your own pronunciation
  - Compare with reference
  - IPA (International Phonetic Alphabet) support
  - Slow/normal speed playback
```

#### 12. Example/Context
**Use Case**: Learn through examples
```
Front: "Use 'ephemeral' in a sentence"
Back: "The morning dew was ephemeral, vanishing as the sun rose."

Alternative format:
Front: "What does 'ephemeral' mean?"
Back:
  Definition: Lasting for a very short time
  Example: "Cherry blossoms are ephemeral, blooming for only a week."
  Synonyms: fleeting, transient, temporary
```

#### 13. Mnemonic/Memory Aid
**Use Case**: Remember with tricks and associations
```
Front: "Order of operations in math"
Back:
  Mnemonic: "Please Excuse My Dear Aunt Sally"
  → Parentheses, Exponents, Multiplication, Division, Addition, Subtraction

Features:
  - Image-based mnemonics
  - Acronyms
  - Story-based memory aids
  - Visual associations
```

#### 14. Timeline/Date
**Use Case**: Historical events, milestones
```
Front: "When did World War II end?"
Back: "1945"

Enhanced format:
Front: "World War II timeline"
Back:
  1939 - War begins (Germany invades Poland)
  1941 - Pearl Harbor (US enters war)
  1945 - War ends (Germany surrenders May 8, Japan surrenders Sep 2)

Features:
  - Visual timeline
  - Zoom to specific periods
  - Related events
```

#### 15. Comparison (Side-by-Side)
**Use Case**: Learn differences between similar concepts
```
Front: "Mitosis vs. Meiosis"
Back:
  Mitosis              | Meiosis
  -------------------- | --------------------
  2 daughter cells     | 4 daughter cells
  Identical to parent  | Genetically different
  Body cells           | Sex cells

Features:
  - Table view
  - Highlight differences
  - Progressive reveal (show one row at a time)
```

#### 16. Code Snippet (Programming)
**Use Case**: Remember syntax, patterns, algorithms
```
Front: "JavaScript: How to filter an array?"
Back:
```javascript
const numbers = [1, 2, 3, 4, 5];
const evenNumbers = numbers.filter(n => n % 2 === 0);
// Result: [2, 4]
```

Features:
  - Syntax highlighting
  - Multiple language support
  - Progressive reveal (hide implementation)
  - Run code inline (optional)
```

### Template Features

#### Visual Template Gallery
- Preview all templates with examples
- "Use This Template" button
- Category filters: Language, Science, Math, General

#### Smart Defaults
- Auto-detect card type from content
- "Translate: X" → Language template
- "Define: X" → Definition template
- "Diagram:" + image → Image occlusion

## Custom Templates (Anki-Level Power)

### Two Paths to Customization

Users can choose their comfort level:
1. **Drag & Drop Builder** (Beginner-friendly, 90% of users)
2. **HTML/CSS Editor** (Advanced, 10% of power users)

Both produce the same result - fully customizable templates with automatic variable extraction.

---

### Path 1: Drag & Drop Template Builder (Recommended)

#### Visual Component Palette

Users build templates by dragging components onto a canvas:

```
┌─────────────────────────────────────────────────────────────┐
│ Template Builder: Spanish Vocabulary Card            [Save] │
├─────────────────────────────────────────────────────────────┤
│ Component Palette      │ Front Side               │ Preview │
│ ┌──────────────────┐   │ ┌─────────────────────┐  │ ┌─────┐│
│ │ 📝 Text Field    │   │ │ ┌─────────────────┐ │  │ │¿Cómo││
│ │ 🖼️  Image Upload  │   │ │ │ {{Question}}    │ │  │ │estás││
│ │ 🎵 Audio Player  │   │ │ └─────────────────┘ │  │ │?    ││
│ │ 📋 Rich Text     │   │ │                     │  │ │     ││
│ │ 🔊 Audio Record  │   │ │ ┌─────────────────┐ │  │ │[🔊] ││
│ │ 🎨 Hint Revealer│   │ │ │ {{Pronunciation}}│  │ │     ││
│ │ 📊 Progress Bar │   │ │ └─────────────────┘ │  │ └─────┘│
│ │ 🏷️  Tags Display │   │ │                     │  │         │
│ │ ⏱️  Timer        │   │ │ [Audio Player]      │  │         │
│ │ 🎯 Difficulty    │   │ │ {{Audio}}           │  │         │
│ └──────────────────┘   │ └─────────────────────┘  │         │
│                        │                          │         │
│                        │ Back Side                │         │
│                        │ ┌─────────────────────┐  │         │
│                        │ │ {{Question}}        │  │         │
│                        │ │ ─────────           │  │         │
│                        │ │ {{Answer}}          │  │         │
│                        │ │ {{Example}}         │  │         │
│                        │ └─────────────────────┘  │         │
└─────────────────────────────────────────────────────────────┘
```

#### How It Works

**Step 1: Drag Components**
```
User drags "Text Field" → System asks: "What should this be called?"
User types: "Question" → Component labeled {{Question}}

User drags "Audio Player" → System asks: "Variable name?"
User types: "Pronunciation" → Component labeled {{Pronunciation}}
```

**Step 2: Automatic Variable Detection**
System automatically:
- Extracts all `{{VariableName}}` placeholders
- Determines data type from component:
  - Text Field → string
  - Image Upload → file (image/*)
  - Audio Player → file (audio/*)
  - Rich Text → html string
  - Number Input → number
  - Date Picker → date

**Step 3: Auto-Generated Input Form**
When creating/editing cards, users see:
```
┌─────────────────────────────────────┐
│ Create Card: Spanish Vocabulary    │
├─────────────────────────────────────┤
│ Question (Text):                    │
│ [¿Cómo estás?________________]      │
│                                     │
│ Answer (Text):                      │
│ [How are you?________________]      │
│                                     │
│ Pronunciation (Audio):              │
│ [Upload] [Record] 🎤                │
│ como-estas.mp3 ✓                    │
│                                     │
│ Example (Rich Text):                │
│ [Rich text editor...]               │
│                                     │
│ Tags:                               │
│ [greetings] [basic] [+Add tag]      │
├─────────────────────────────────────┤
│              [Save Card]            │
└─────────────────────────────────────┘
```

#### Component Library

**Text Components:**
- **Text Field** (single line) → `{{VariableName}}`
- **Rich Text Area** (formatted) → `{{VariableName}}`
- **Code Block** (syntax highlighted) → `{{Code}}` + language selector
- **LaTeX Equation** (math rendering) → `{{Equation}}`

**Media Components:**
- **Image Upload** → `{{ImageName}}` (drag/drop, paste, URL)
- **Audio Player** → `{{AudioName}}` (upload, record, URL)
- **Video Embed** → `{{VideoName}}` (future)

**Interactive Components:**
- **Hint Revealer** (click to show) → `{{Hint}}`
- **Progressive List** (show one at a time) → `{{ListItems}}`
- **Timer** (countdown) → auto-added, no variable
- **Difficulty Badge** → auto-calculated from stats

**Layout Components:**
- **Divider** (horizontal line)
- **Columns** (2-3 column layout)
- **Spacer** (adjust spacing)
- **Card Background** (color/gradient)

#### Component Properties Panel

Click any component to customize:
```
┌─────────────────────────────────────┐
│ Component: Text Field               │
├─────────────────────────────────────┤
│ Variable Name:                      │
│ [Question____________]              │
│                                     │
│ Label:                              │
│ [Question____________]              │
│                                     │
│ Font Size:                          │
│ ○ Small  ● Medium  ○ Large          │
│                                     │
│ Alignment:                          │
│ ○ Left  ● Center  ○ Right           │
│                                     │
│ Color:                              │
│ [●] Use theme color                 │
│ [ ] Custom: [#______]               │
│                                     │
│ Required:                           │
│ ☑ This field must be filled         │
└─────────────────────────────────────┘
```

#### Layout Tools

**Visual Alignment:**
- Snap-to-grid
- Alignment guides (like Figma/Canva)
- Distribute evenly
- Group/ungroup components

**Responsive Preview:**
- Desktop view (default)
- Mobile view (auto-scales)
- Both sides simultaneously

#### Template Saving

**Save as Template:**
```
Template Name: [Spanish Vocabulary Card____]
Category: [Language Learning ▼]
Icon: [🇪🇸] (emoji picker)
Description: [Perfect for vocab with audio...]

☑ Make public (share with community)
☐ Allow remixing

[Save Template]
```

Users can then browse/search templates:
- "Spanish" → Shows all Spanish templates
- "Medical" → Anatomy diagrams, terminology
- "Code" → Programming snippets with syntax highlighting

---

### Path 2: HTML/CSS Editor (Advanced)

For power users who want full control:

#### Interface Features
```
┌─────────────────────────────────────────────────┐
│ Template Editor                           [Save] │
├─────────────────────────────────────────────────┤
│ Front Template        │ Live Preview            │
│ ┌──────────────────┐  │ ┌──────────────────┐    │
│ │ <div class="card">│  │ │  What is the    │    │
│ │   <h1>{{Front}}</h1│  │ │  capital of     │    │
│ │   {{#Image}}     │  │ │  France?        │    │
│ │   <img src="{{Image}}">│  │               │    │
│ │   {{/Image}}     │  │ │                 │    │
│ │ </div>           │  │ └──────────────────┘    │
│ └──────────────────┘  │                         │
│                       │                         │
│ Back Template         │ Theme Variables         │
│ ┌──────────────────┐  │ ┌──────────────────┐    │
│ │ <div class="card">│  │ │ --primary-color │    │
│ │   {{FrontSide}}  │  │ │ --bg-card       │    │
│ │   <hr>           │  │ │ --text-primary  │    │
│ │   <h2>{{Back}}</h2>│  │ │ --font-heading  │    │
│ │ </div>           │  │ └──────────────────┘    │
│ └──────────────────┘  │                         │
└─────────────────────────────────────────────────┘
```

#### Autocomplete Support
As users type in the HTML editor:
- `{{` → Show field suggestions (Front, Back, Extra, Image, Audio)
- `--` → Show theme variable suggestions with live color previews
- `<div class="` → Show available CSS classes

#### Pre-made HTML Snippets
**Quick Insert Menu**:
- Image Gallery Layout
- Two-Column Layout
- Flashcard with Hint Reveal
- Code Syntax Highlighting
- Mathematical Equation (LaTeX)
- Audio Player Controls

### Template Variables

#### Standard Fields
```html
{{Front}}           <!-- Main question/prompt -->
{{Back}}            <!-- Answer -->
{{Extra}}           <!-- Additional info -->
{{Image}}           <!-- Image URL -->
{{Audio}}           <!-- Audio URL -->
{{Tags}}            <!-- Card tags -->
{{Type}}            <!-- Card type -->
{{Deck}}            <!-- Deck name -->
```

#### Conditional Fields
```html
{{#Image}}
  <img src="{{Image}}" alt="Card image">
{{/Image}}

{{^Audio}}
  <p>No audio available</p>
{{/Audio}}
```

#### Theme Variables (CSS Custom Properties)
```css
/* Auto-synced with active theme */
var(--primary-color)
var(--secondary-color)
var(--bg-card)
var(--bg-card-hover)
var(--text-primary)
var(--text-secondary)
var(--font-heading)
var(--font-body)
var(--border-radius)
var(--shadow-card)
```

### Template Gallery (Curated Collection)

#### Built-in Templates
1. **Minimal** - Clean, distraction-free
2. **Bold** - High contrast, large text
3. **Gradient** - Modern, colorful
4. **Academic** - Traditional, serif fonts
5. **Code** - Syntax highlighting, monospace
6. **Language** - IPA support, bilingual layout
7. **Medical** - Anatomy diagrams, terminology
8. **Math** - LaTeX rendering, equation formatting

Users can:
- Preview all templates
- Clone and customize
- Share templates with community
- Import from Anki shared decks

## Media Support

### Image Support
- **Formats**: PNG, JPG, SVG, WebP, GIF
- **Features**:
  - Drag & drop upload
  - Paste from clipboard
  - URL linking
  - Image occlusion (draw masks)
  - Auto-resize for performance

### Audio Support
- **Formats**: MP3, WAV, OGG, M4A
- **Features**:
  - Record directly in app
  - Upload files
  - Text-to-Speech generation
  - Playback controls
  - Auto-play on card reveal

### Video Support (Future)
- **Formats**: MP4, WebM
- **Features**:
  - Timestamp linking
  - Speed controls
  - Subtitle support

## Spaced Repetition System

### Layer 1: Easy Presets (Quizlet-Style)

#### One-Click Settings
```
┌─────────────────────────────────────┐
│ Spaced Repetition                   │
├─────────────────────────────────────┤
│ ○ Relaxed    (Review every 2-4 days)│
│ ● Balanced   (Review every 1-3 days)│ ← Default
│ ○ Intense    (Review daily)         │
│ ○ Custom     (Advanced settings)    │
└─────────────────────────────────────┘
```

**Presets Explained**:
- **Relaxed**: Casual learning, longer intervals
- **Balanced**: Standard Anki-like intervals
- **Intense**: Exam prep, frequent reviews

### Layer 2: Custom Algorithm (Anki-Style)

#### Global Default Settings
```
┌─────────────────────────────────────────────────┐
│ Advanced Spaced Repetition Settings            │
├─────────────────────────────────────────────────┤
│ New Cards                                       │
│   Steps: [1m, 10m, 1d]                         │
│   Graduating interval: [1] day                  │
│   Easy interval: [4] days                       │
│   Starting ease: [250]%                         │
│                                                 │
│ Review Cards                                    │
│   Easy bonus: [130]%                            │
│   Interval modifier: [100]%                     │
│   Maximum interval: [36500] days                │
│   Hard interval: [120]%                         │
│                                                 │
│ Lapses                                          │
│   Relearning steps: [10m]                       │
│   New interval: [0]%                            │
│   Minimum interval: [1] day                     │
│   Leech threshold: [8] lapses                   │
└─────────────────────────────────────────────────┘
```

#### Per-Deck Overrides
Each deck can override global settings:
```
Deck: "Spanish Vocabulary"
Override: Intense preset
  - More frequent reviews
  - Shorter intervals

Deck: "History Facts"
Override: Relaxed preset
  - Longer intervals
  - Less pressure
```

### Algorithm Features

#### SM-2 Based (Anki Compatible)
- **New cards**: Learning phase with short intervals
- **Young cards**: Graduated but still establishing
- **Mature cards**: Longer intervals (weeks/months)
- **Lapses**: Failed cards re-enter learning

#### Smart Scheduling
- **Daily Review Limit**: Cap cards per day
- **New Card Introduction**: Gradual ramping
- **Review Timing**: Optimal spacing based on research
- **Deck Priorities**: Review critical decks first

#### Progress Tracking
```
┌─────────────────────────────────────┐
│ Today's Progress                    │
├─────────────────────────────────────┤
│ ■■■■■■■■□□ 8/10 Reviews Complete    │
│                                     │
│ New: 3 cards                        │
│ Learning: 5 cards                   │
│ Review: 2 cards                     │
│                                     │
│ Streak: 🔥 12 days                  │
└─────────────────────────────────────┘
```

## Learning Modes (Quizlet-Style Variety)

**Philosophy**: Flashcards aren't just for flipping - users should be able to learn and practice in multiple engaging ways!

### Mode Categories

#### 📚 Study Modes (Primary Learning)
1. **Classic Review** - Traditional flashcard flipping
2. **Spaced Repetition** - Smart scheduling (Anki SM-2)
3. **Shuffle** - Random order practice
4. **Cram** - Quick review before exams

#### 🎮 Game Modes (Active Engagement)
5. **Match** - Pair terms with definitions (timed)
6. **Type Race** - Type answers before timer expires
7. **Memory Grid** - Flip and match pairs

#### ✍️ Practice Modes (Active Recall)
8. **Write Mode** - Type all answers
9. **Speak Mode** - Voice pronunciation practice (future)
10. **Draw Mode** - Sketch answers (for diagrams)

---

### Detailed Mode Descriptions

#### 1. Classic Review
**Perfect for**: Initial learning, casual review
```
┌─────────────────────────────────┐
│ Card 5/20              [⚙️]     │
├─────────────────────────────────┤
│                                 │
│        What is the capital      │
│           of France?            │
│                                 │
│         [Show Answer]           │
│                                 │
│  [← Previous]    [Next →]       │
└─────────────────────────────────┘
```
- Manual pace (no time pressure)
- Navigate forward/backward
- No grading/scoring
- Star cards for later review

#### 2. Spaced Repetition (Smart Review)
**Perfect for**: Long-term retention, exam prep
```
┌─────────────────────────────────┐
│ Due Today: 12 cards    [⚙️]     │
├─────────────────────────────────┤
│ Question: What is photosynthesis?│
│                                 │
│ Answer: Process of converting...│
│                                 │
│ How well did you know this?     │
│ [Again] [Hard] [Good] [Easy]    │
│  <1m     <10m    1d      4d     │
└─────────────────────────────────┘
```
- Shows cards when you're about to forget
- 4-button grading
- Intelligent interval calculation
- Focus on weak cards

#### 3. Shuffle Mode
**Perfect for**: Breaking position memorization
```
┌─────────────────────────────────┐
│ Shuffle Mode: 20 cards [⚙️]     │
├─────────────────────────────────┤
│ Filters:                        │
│ ☑ Include starred cards         │
│ ☐ Only cards I've struggled with│
│ Tags: [biology] [×]             │
│                                 │
│ [Start Shuffled Review]         │
└─────────────────────────────────┘
```
- Random order each session
- Filter by tags/difficulty
- Track which cards seen
- Option to exclude mastered cards

#### 4. Cram Mode (Quick Review)
**Perfect for**: Last-minute review, test tomorrow
```
┌─────────────────────────────────┐
│ Cram Session: 50 cards [⚙️]     │
├─────────────────────────────────┤
│ Time limit: [20] minutes        │
│ Show answer after: [3] seconds  │
│                                 │
│ Quick grade:                    │
│ ● Know it / Don't know it       │
│ ○ Full 4-button grading         │
│                                 │
│ ☑ Skip cards I already know     │
│                                 │
│ [Start Cram Session]            │
└─────────────────────────────────┘
```
- Fast-paced review
- Auto-advance timer
- Simplified grading
- No scheduling changes
- Progress bar shows completion

#### 5. Match Game
**Perfect for**: Speed learning, competitive practice
```
┌─────────────────────────────────┐
│ Match Game          Timer: 1:45 │
├─────────────────────────────────┤
│ Terms              Definitions   │
│ ┌─────────┐       ┌──────────┐  │
│ │ Mitosis │       │4 daughter│  │
│ └─────────┘       │ cells    │  │
│                   └──────────┘  │
│ ┌─────────┐       ┌──────────┐  │
│ │ Meiosis │────   │2 daughter│  │
│ └─────────┘       │ cells    │  │
│                   └──────────┘  │
│ Matched: 3/8           Score: 45│
└─────────────────────────────────┘
```
- Drag to connect or click pairs
- Timer adds urgency
- Leaderboard (optional)
- Combo multiplier for streaks
- Visual/audio feedback

#### 6. Type Race
**Perfect for**: Typing practice, active recall
```
┌─────────────────────────────────┐
│ Type Race          Speed: 2.1x  │
├─────────────────────────────────┤
│ [===========          ] 11/20   │
│                                 │
│ ┌─────────────────┐             │
│ │ What is H₂O?    │ ↓↓↓         │
│ └─────────────────┘             │
│                                 │
│ Type your answer:               │
│ [water_______________]          │
│                                 │
│ Streak: 🔥🔥🔥 3   Score: 150   │
└─────────────────────────────────┘
```
- Cards "fall" from top
- Type answer before reaching bottom
- Speed increases gradually
- Accepts close matches
- Bonus points for speed

#### 7. Memory Grid
**Perfect for**: Visual memory, pattern recognition
```
┌─────────────────────────────────┐
│ Memory Grid        Flips: 12    │
├─────────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐         │
│ │ ? │ │ ? │ │ ? │ │ ? │         │
│ └───┘ └───┘ └───┘ └───┘         │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐         │
│ │ ? │ │ ? │ │ ? │ │ ? │         │
│ └───┘ └───┘ └───┘ └───┘         │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐         │
│ │ ? │ │ ? │ │ ? │ │ ? │         │
│ └───┘ └───┘ └───┘ └───┘         │
│                                 │
│ Pairs Found: 2/6    Time: 1:23  │
└─────────────────────────────────┘
```
- Classic memory/concentration game
- Front on one card, back on another
- Click to flip, match pairs
- Grid size adjusts to deck size
- Track best time

#### 8. Write Mode
**Perfect for**: Spelling practice, exact recall
```
┌─────────────────────────────────┐
│ Write Mode         Progress 7/15│
├─────────────────────────────────┤
│ Translate to Spanish:           │
│                                 │
│ "Hello, how are you?"           │
│                                 │
│ [Hola, ¿cómo estás?_________]   │
│                                 │
│ [Check Answer]                  │
│                                 │
│ Show hint? [💡]                 │
└─────────────────────────────────┘

After checking:
┌─────────────────────────────────┐
│ ✅ Correct!                     │
│                                 │
│ Your answer:                    │
│ "Hola, ¿cómo estás?"           │
│                                 │
│ Expected:                       │
│ "Hola, ¿cómo estás?"           │
│                                 │
│ [Next Card →]                   │
└─────────────────────────────────┘
```
- Type complete answers
- Fuzzy matching (close = correct)
- Show differences on mistakes
- Builds typing muscle memory
- Option for strict/lenient grading

#### 9. Speak Mode (Future - Voice Recognition)
**Perfect for**: Pronunciation, language learning
```
┌─────────────────────────────────┐
│ Speak Mode      Accuracy: 87%   │
├─────────────────────────────────┤
│ Pronounce this Spanish phrase:  │
│                                 │
│ "Buenos días"                   │
│                                 │
│ [Reference Audio 🔊]            │
│                                 │
│ [🎤 Tap to Record]              │
│                                 │
│ Streak: 🔥 5   Perfect: 12/15   │
└─────────────────────────────────┘
```
- Voice recognition
- Compare to reference audio
- Pronunciation scoring
- Repeat until correct
- Track improvement over time

#### 10. Draw Mode (Future - Sketch Recognition)
**Perfect for**: Diagrams, visual learning
```
┌─────────────────────────────────┐
│ Draw Mode         Question 3/10 │
├─────────────────────────────────┤
│ Draw the structure of H₂O       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  [Canvas for drawing]       │ │
│ │                             │ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Tools: ✏️ ⭕ → ↩️ 🗑️            │
│                                 │
│ [Show Answer] [Next →]          │
└─────────────────────────────────┘
```
- Freehand drawing canvas
- Shape tools (circle, line, arrow)
- Compare to reference drawing
- Manual grading (self-assessment)
- Save sketches with card

---

### Mode Selection Screen

```
┌─────────────────────────────────────────────────┐
│ Spanish Vocabulary (142 cards)         [⚙️ Edit]│
├─────────────────────────────────────────────────┤
│ How would you like to study?                    │
│                                                 │
│ 📚 Study                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Classic  │ │ Spaced   │ │ Shuffle  │         │
│ │ Review   │ │Repetition│ │  Mode    │         │
│ │          │ │ 12 due   │ │          │         │
│ └──────────┘ └──────────┘ └──────────┘         │
│                                                 │
│ ┌──────────┐                                    │
│ │  Cram    │                                    │
│ │  Mode    │                                    │
│ └──────────┘                                    │
│                                                 │
│ 🎮 Games                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │  Match   │ │   Type   │ │ Memory   │         │
│ │  Game    │ │   Race   │ │  Grid    │         │
│ └──────────┘ └──────────┘ └──────────┘         │
│                                                 │
│ ✍️ Practice                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │  Write   │ │  Speak   │ │   Draw   │         │
│ │  Mode    │ │  Mode    │ │   Mode   │         │
│ │          │ │ 🔒 Soon  │ │ 🔒 Soon  │         │
│ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────┘
```

---

## Study Interface

### Quizlet-Inspired UI

#### Study Mode Selection
```
┌─────────────────────────────────────────────────┐
│ How would you like to study?                    │
├─────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│ │ Flashcards│ │   Learn   │ │   Test    │      │
│ │    👀     │ │    🧠     │ │    ✅     │      │
│ └───────────┘ └───────────┘ └───────────┘      │
│                                                 │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│ │   Match   │ │  Gravity  │ │  Spaced   │      │
│ │    🎯     │ │    🚀     │ │    📅     │      │
│ └───────────┘ └───────────┘ └───────────┘      │
└─────────────────────────────────────────────────┘
```

#### Card Review Interface
```
┌─────────────────────────────────────────────────┐
│ Spanish Verbs                  Progress: 12/50  │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              ┌──────────────────┐               │
│              │                  │               │
│              │   ¿Cómo estás?   │               │
│              │                  │               │
│              └──────────────────┘               │
│                                                 │
│                [Show Answer]                    │
│                                                 │
└─────────────────────────────────────────────────┘

After reveal:
┌─────────────────────────────────────────────────┐
│ Spanish Verbs                  Progress: 12/50  │
├─────────────────────────────────────────────────┤
│              ┌──────────────────┐               │
│              │   ¿Cómo estás?   │               │
│              └──────────────────┘               │
│                      ───                        │
│              ┌──────────────────┐               │
│              │   How are you?   │               │
│              └──────────────────┘               │
│                                                 │
│   [Again]    [Hard]    [Good]    [Easy]        │
│     <1m       <10m      <1d       ~4d          │
└─────────────────────────────────────────────────┘
```

### Study Modes

#### 1. Classic Review
- Flip through cards at your own pace
- Manual navigation (next/previous)
- No grading, pure review
- Perfect for initial learning

#### 2. Spaced Repetition (Smart Review)
- Anki-style SM-2 algorithm
- Four-button grading (Again, Hard, Good, Easy)
- Intelligent scheduling based on performance
- Shows cards when you're about to forget

#### 3. Shuffle Mode
- Random card order
- Prevents memorizing by position
- Good for refreshing knowledge
- Optional: filter by tags/difficulty

#### 4. Cram Mode (Quick Review)
- Review all cards in deck
- Simplified grading (Know it / Don't know it)
- Perfect for last-minute review
- No scheduling changes

#### 5. Practice Mode (Input Focus)
- For Input/Cloze card types
- Type answer before reveal
- Immediate feedback
- Builds muscle memory

### Keyboard Shortcuts
```
Space       - Reveal answer
1/2/3/4     - Grade card (Again/Hard/Good/Easy)
↑ ↓         - Navigate cards
R           - Replay audio
E           - Edit card
S           - Star/flag card
U           - Undo last grade
```

## Import/Export

### Import Formats

#### 1. Anki Package (.apkg)
**Support Level**: Full compatibility
- Parse SQLite database
- Extract media files
- Import scheduling history (optional)
- Convert templates to ChayCards format

#### 2. Anki Text Export (.txt, .csv)
**Support Level**: Full compatibility
- Tab-delimited parsing
- HTML support
- Media references
- Tag import

#### 3. Quizlet Export
**Support Level**: Full compatibility
- Tab-delimited text
- Copy/paste support
- Bulk import

#### 4. CSV (Universal)
**Support Level**: Full compatibility
```csv
Front,Back,Tags,Image,Audio
"What is the capital of France?","Paris","geography,europe","","flag.mp3"
"Define: photosynthesis","Process of converting light to energy","biology,science","diagram.png",""
```

#### 5. JSON (ChayCards Native)
**Support Level**: Full compatibility
- Preserves all metadata
- Includes templates
- Scheduling history
- Media references

### Export Formats

Users can export to:
- **ChayCards JSON** (full fidelity)
- **Anki .apkg** (for Anki users)
- **CSV** (universal compatibility)
- **Quizlet text** (copy/paste into Quizlet)
- **Markdown** (human-readable backup)
- **PDF** (printable flashcards)

## Deck Management

### Deck Organization

#### Hierarchical Structure
```
📚 Language Learning
  ├── 🇪🇸 Spanish
  │   ├── Verbs
  │   ├── Vocabulary
  │   └── Grammar
  ├── 🇫🇷 French
  │   ├── Pronunciation
  │   └── Common Phrases
  └── 🇩🇪 German
```

#### Deck Features
- **Tags**: Multi-level tagging system
- **Colors**: Visual categorization
- **Icons**: Custom deck icons
- **Sharing**: Export/import decks
- **Collaboration**: Shared decks (future)

### Deck Settings

#### Per-Deck Configuration
```
┌─────────────────────────────────────────────────┐
│ Deck: Spanish Verbs                             │
├─────────────────────────────────────────────────┤
│ Study Settings                                  │
│   Spaced Repetition: Intense preset             │
│   New cards per day: [20]                       │
│   Review cards per day: [100]                   │
│                                                 │
│ Card Display                                    │
│   Template: Language (Bilingual)                │
│   Show hints: [✓]                               │
│   Auto-play audio: [✓]                          │
│                                                 │
│ Advanced                                        │
│   Enable reverse cards: [✓]                     │
│   Randomize card order: [✓]                     │
│   Bury related cards: [✓]                       │
└─────────────────────────────────────────────────┘
```

## Statistics & Analytics

### Progress Dashboard
```
┌─────────────────────────────────────────────────┐
│ Your Learning Journey                           │
├─────────────────────────────────────────────────┤
│ 🔥 Streak: 28 days                              │
│ 📊 Total Cards: 1,247                           │
│ ✅ Mastered: 823 (66%)                          │
│ 📚 Decks: 12                                    │
│                                                 │
│ Today's Forecast                                │
│   New: 15 cards                                 │
│   Review: 42 cards                              │
│   Estimated time: 18 minutes                    │
│                                                 │
│ This Week                                       │
│   [████████████░░░] 85% completion              │
│   567 cards reviewed                            │
│   Average accuracy: 89%                         │
└─────────────────────────────────────────────────┘
```

### Detailed Analytics
- **Retention Rate**: % of cards remembered over time
- **Answer Speed**: Average time per card
- **Difficult Cards**: Cards often forgotten
- **Study Patterns**: Best study times
- **Deck Comparisons**: Performance across decks
- **Historical Trends**: Long-term progress graphs

## Technical Implementation

### Plugin Architecture

#### Core Plugin: `core-flashcards`
**Responsibilities**:
- Card CRUD operations
- Template engine
- Spaced repetition algorithm
- Study mode UI
- Import/export handlers

#### Database Schema
```sql
-- Cards table
CREATE TABLE cards (
  id INTEGER PRIMARY KEY,
  deck_id INTEGER,
  template_id INTEGER,
  front TEXT,
  back TEXT,
  extra TEXT,
  image_url TEXT,
  audio_url TEXT,
  tags TEXT, -- JSON array
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Card state (for spaced repetition)
CREATE TABLE card_state (
  card_id INTEGER PRIMARY KEY,
  ease_factor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  due_date TIMESTAMP,
  review_count INTEGER DEFAULT 0,
  lapse_count INTEGER DEFAULT 0,
  state TEXT -- 'new', 'learning', 'review', 'relearning'
);

-- Decks table
CREATE TABLE decks (
  id INTEGER PRIMARY KEY,
  name TEXT,
  parent_id INTEGER,
  settings TEXT, -- JSON configuration
  created_at TIMESTAMP
);

-- Templates table
CREATE TABLE templates (
  id INTEGER PRIMARY KEY,
  name TEXT,
  front_template TEXT,
  back_template TEXT,
  css TEXT,
  created_at TIMESTAMP
);

-- Review history
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  card_id INTEGER,
  grade INTEGER, -- 1-4 (Again, Hard, Good, Easy)
  interval INTEGER,
  ease_factor REAL,
  reviewed_at TIMESTAMP
);
```

#### API Endpoints (IPC)
```typescript
// Card operations
flashcards.createCard(card: CardData): Promise<Card>
flashcards.updateCard(id: number, updates: Partial<CardData>): Promise<void>
flashcards.deleteCard(id: number): Promise<void>
flashcards.getCard(id: number): Promise<Card>

// Deck operations
flashcards.createDeck(deck: DeckData): Promise<Deck>
flashcards.getDueCards(deckId?: number): Promise<Card[]>
flashcards.reviewCard(cardId: number, grade: Grade): Promise<void>

// Templates
flashcards.getTemplates(): Promise<Template[]>
flashcards.saveTemplate(template: Template): Promise<void>

// Import/Export
flashcards.importAnki(file: File): Promise<ImportResult>
flashcards.exportDeck(deckId: number, format: ExportFormat): Promise<Blob>
```

### Performance Optimizations

#### Lazy Loading
- Load only visible cards
- Virtualized scrolling for large decks
- Background media preloading

#### Caching
- Template compilation cache
- Media file cache (IndexedDB)
- Computed schedules cache

#### Offline Support
- Full offline functionality
- Background sync when online
- Conflict resolution for shared decks

## Community Marketplace (Future Feature)

### Vision: User-Generated Content Library

Build a community-driven deck marketplace to compete with Quizlet's 700M+ deck library. **Storage-based pricing model** - free users get limited community publishing, paid users get unlimited.

### Core Principle: Charge for Server Resources, Not Features

```
Personal Decks (Local Storage):
✅ Unlimited forever - Stored on user's device
✅ Costs you nothing = Free for users

Community Decks (Server Storage):
⚠️ Limited for free - Costs server resources
💰 Paid tiers for unlimited - Covers infrastructure
```

### Pricing Tiers

```
🆓 Free Tier (Default - 90% of users)
┌─────────────────────────────────────┐
│ Personal Decks:                     │
│ ✅ Unlimited (local storage)        │
│ ✅ All study modes                  │
│ ✅ Full customization               │
│                                     │
│ Community Publishing:               │
│ ✅ Up to 3 community decks          │
│ ✅ 10MB per deck (images/audio)     │
│ ✅ Full download/browse access      │
│                                     │
│ Perfect for: Casual sharers         │
└─────────────────────────────────────┘

💎 Creator Tier ($2.99/month or $24/year)
┌─────────────────────────────────────┐
│ Everything in Free, plus:           │
│ ✅ Unlimited community decks        │
│ ✅ 50MB per deck                    │
│ ✅ Advanced analytics dashboard     │
│ ✅ Priority deck placement          │
│ ✅ Creator badge 🎨                 │
│                                     │
│ Perfect for: Active publishers      │
└─────────────────────────────────────┘

🚀 Pro Tier ($9.99/month or $79/year)
┌─────────────────────────────────────┐
│ Everything in Creator, plus:        │
│ ✅ Sell decks (80% payout)          │
│ ✅ 500MB per deck (video support)   │
│ ✅ API access for integrations      │
│ ✅ Priority support                 │
│ ✅ White-label exports (PDF, etc.)  │
│                                     │
│ Perfect for: Professional educators │
└─────────────────────────────────────┘

🏆 Elite Creators (Auto-Granted)
┌─────────────────────────────────────┐
│ Pro Tier FREE (lifetime)            │
│ Earned by achieving:                │
│ • 100,000+ downloads                │
│ • 1,000+ reviews                    │
│ • 4.7+ average rating               │
│                                     │
│ Rewards top-quality creators        │
└─────────────────────────────────────┘
```

### Community Tab UI

The Community Marketplace is a separate tab in the flashcards application.

```
┌───────────────────────────────────────────────────────────┐
│ Flashcards                                                │
├───────────────────────────────────────────────────────────┤
│ [Home] [My Decks] [Community] [Statistics]               │
│                    ▲                                      │
│                  Active                                   │
└───────────────────────────────────────────────────────────┘
```

#### Community Home Screen

```
┌───────────────────────────────────────────────────────────┐
│ Community Decks                    [🔍 Search] [+ Publish]│
├───────────────────────────────────────────────────────────┤
│                                                           │
│ 🔥 Trending This Week                                     │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🇪🇸 Spanish 1000 Most Common Words                  │   │
│ │ by @LanguageMaster 📕 • 847K uses • ⭐ 4.9         │   │
│ │ [Preview] [Add to My Decks]                          │   │
│ │                                                      │   │
│ │ 💻 JavaScript Interview Prep                         │   │
│ │ by @CodeAcademy 📘 • 523K uses • ⭐ 4.8            │   │
│ │ [Preview] [Add to My Decks]                          │   │
│ │                                                      │   │
│ │ 🧬 Anatomy & Physiology Complete                     │   │
│ │ by @MedStudyPro 📕 • 412K uses • ⭐ 4.9            │   │
│ │ [Preview] [Add to My Decks]                          │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ 📚 Browse by Category                                     │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐               │
│ │ Languages │ │  Science  │ │    Math   │               │
│ │  🗣️ 2.4M  │ │  🔬 1.8M  │ │  ➗ 1.2M  │               │
│ └───────────┘ └───────────┘ └───────────┘               │
│                                                           │
│ ⭐ Highest Rated • 🆕 New Releases • 👥 Most Used        │
└───────────────────────────────────────────────────────────┘
```

### Creator Badge System (Auto-Awarded)

Quality emerges naturally through community reviews and usage stats.

```
🏅 Creator Badges (Earned Through Quality)

📗 Emerging Creator
• 100+ downloads • 10+ reviews • 4.0+ rating
→ Badge on profile

📘 Established Creator
• 1,000+ downloads • 50+ reviews • 4.3+ rating
→ Featured in "Popular This Week"

📕 Top Creator
• 10,000+ downloads • 200+ reviews • 4.5+ rating
→ Priority search placement, featured spotlight

📙 Elite Creator
• 100,000+ downloads • 1,000+ reviews • 4.7+ rating
→ Blue checkmark ✓, Pro tier free forever
```

### When Users Hit Limits

```
Free User Publishing 4th Deck:
┌─────────────────────────────────────┐
│ ⚠️ Community Deck Limit Reached     │
├─────────────────────────────────────┤
│ You've published 3/3 free decks.    │
│                                     │
│ To publish more:                    │
│                                     │
│ 💎 Upgrade to Creator ($2.99/mo)    │
│ ✅ Unlimited community decks        │
│ ✅ 50MB per deck                    │
│ ✅ Advanced analytics               │
│                                     │
│ [Upgrade Now] [Maybe Later]         │
│                                     │
│ Or delete an existing deck:         │
│ [Manage My Decks]                   │
└─────────────────────────────────────┘
```

### Database Schema

```sql
-- Community decks
CREATE TABLE community_decks (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  title TEXT,
  description TEXT,
  category TEXT,
  tags TEXT, -- JSON array
  download_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User subscription tier
CREATE TABLE user_subscriptions (
  user_id INTEGER PRIMARY KEY,
  tier TEXT DEFAULT 'free', -- 'free', 'creator', 'pro', 'elite'
  subscribed_at TIMESTAMP,
  expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE
);

-- Storage quota tracking
CREATE TABLE user_storage (
  user_id INTEGER PRIMARY KEY,
  community_deck_count INTEGER DEFAULT 0,
  total_bytes_used BIGINT DEFAULT 0,
  quota_deck_count INTEGER DEFAULT 3, -- Free: 3, Paid: 999999
  quota_bytes_per_deck BIGINT DEFAULT 10485760, -- Free: 10MB, Creator: 50MB, Pro: 500MB
  last_updated TIMESTAMP
);

-- Creator badges (auto-awarded)
CREATE TABLE creator_badges (
  user_id INTEGER,
  badge_type TEXT, -- 'emerging', 'established', 'top', 'elite'
  earned_at TIMESTAMP,
  PRIMARY KEY (user_id, badge_type)
);

-- Reviews & ratings
CREATE TABLE community_reviews (
  id INTEGER PRIMARY KEY,
  deck_id INTEGER,
  user_id INTEGER,
  rating INTEGER, -- 1-5 stars
  review_text TEXT,
  created_at TIMESTAMP,
  UNIQUE(deck_id, user_id)
);

-- User downloads
CREATE TABLE community_downloads (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  deck_id INTEGER,
  downloaded_at TIMESTAMP,
  UNIQUE(user_id, deck_id)
);

-- Deck purchases (for Pro tier deck sales)
CREATE TABLE deck_purchases (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  deck_id INTEGER,
  amount DECIMAL(10,2),
  platform_fee DECIMAL(10,2), -- 20% fee
  creator_payout DECIMAL(10,2), -- 80% to creator
  purchased_at TIMESTAMP,
  UNIQUE(user_id, deck_id)
);
```

### API Endpoints

```typescript
// Browse community
flashcards.community.browse(filters: BrowseFilters): Promise<CommunityDeck[]>
flashcards.community.search(query: string, filters: SearchFilters): Promise<CommunityDeck[]>
flashcards.community.getTrending(): Promise<CommunityDeck[]>
flashcards.community.getTopRated(): Promise<CommunityDeck[]>

// Deck operations
flashcards.community.getDeck(deckId: number): Promise<CommunityDeckDetails>
flashcards.community.addToMyDecks(deckId: number): Promise<void>
flashcards.community.purchase(deckId: number, paymentInfo: PaymentInfo): Promise<void>

// Publishing (respects tier limits)
flashcards.community.publish(deck: LocalDeck, settings: PublishSettings): Promise<CommunityDeck>
flashcards.community.update(deckId: number, updates: Partial<CommunityDeck>): Promise<void>
flashcards.community.unpublish(deckId: number): Promise<void>

// Reviews
flashcards.community.submitReview(deckId: number, review: ReviewData): Promise<void>
flashcards.community.reportDeck(deckId: number, reason: string): Promise<void>

// Creator dashboard
flashcards.community.getMyPublishedDecks(): Promise<PublishedDeck[]>
flashcards.community.getDeckStats(deckId: number): Promise<DeckStats>
```

### Implementation Timeline

```
Phase 1 (Launch): Free & Open
- Launch with everything free
- No deck limits initially
- Build user base organically

Phase 2 (6-12 months): Introduce Tiers
- Announce storage-based tiers
- Grandfather existing users (keep their decks)
- New users: 3 deck limit on free tier

Phase 3 (12+ months): Optional Premium
- Enable deck sales for Pro tier users
- 80/20 revenue split (creator/platform)
- Only if community actively requests it
```

### Why This Model Works

```
✅ Fair Resource Pricing
- Free tier generous (3 decks = most users)
- Pay only for server resources you use
- Elite creators rewarded (free Pro tier)

✅ No Feature Paywalls
- All study features always free
- Spaced repetition always free
- Templates always free
- Only server storage costs money

✅ Sustainable Business
- Covers infrastructure costs
- Profit margin without ads
- Revenue scales with usage

✅ Clean Experience
- No watermarks anywhere
- No branding clutter
- Pure content focus
```

---

## Future Enhancements

### Phase 2 Features
- **Collaborative Decks**: Share and edit with others in real-time
- **AI Card Generation**: Auto-create cards from documents, PDFs, videos
- **Voice Recording**: Record pronunciations for language learning
- **Handwriting Recognition**: Draw answers for math, chemistry diagrams
- **Community Marketplace**: ✅ **Designed** (see section above, implement when needed)

### Phase 3 Features
- **Mobile Apps**: iOS/Android with native features
- **Web Clipper**: Create cards from websites (browser extension)
- **Integration APIs**: Connect with other learning tools (Canvas, Moodle, etc.)
- **Machine Learning**: Personalized algorithm tuning based on study patterns
- **Advanced Gamification**: Achievements, global streaks, challenges, study tournaments

## Success Metrics

### User Experience Goals
- **Onboarding**: Create first deck in < 2 minutes
- **Speed**: Card review < 100ms response time
- **Retention**: 80%+ weekly active user retention
- **Satisfaction**: 4.5+ star rating

### Technical Goals
- **Import Success**: 99%+ Anki deck compatibility
- **Performance**: Handle 10,000+ cards per deck
- **Reliability**: < 0.1% data loss rate
- **Sync Speed**: < 5s for 1,000 card sync

---

## Summary

ChayCards flashcards will be the **first** flashcard system that truly doesn't compromise. Users get:

✅ **Quizlet's UX**: Beautiful, intuitive, fast
✅ **Anki's Power**: Deep customization, proven algorithms, full import compatibility
✅ **Modern Tech**: Fast, offline-first, cross-platform
✅ **Open Ecosystem**: Import/export everything, community templates

### Final Card Type Count: 16 Types

**Core Learning** (1-7):
- Basic, Cloze, Input, Input w/Checking, Image Occlusion, Audio, Reverse

**Content Presentation** (8-13):
- List/Bullets, Diagram, Formula, Pronunciation, Example/Context, Mnemonic

**Structured Learning** (14-16):
- Timeline/Date, Comparison, Code Snippet

This covers every individual study need from language learning to medical school, while keeping the scope focused on **personal flashcard review**, not formal testing. Tests and quizzes will be handled by separate plugins with proper assessment features (scoring, analytics, timed exams, etc.).
