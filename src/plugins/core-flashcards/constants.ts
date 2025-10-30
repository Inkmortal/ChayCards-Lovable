/**
 * Core Flashcard System Constants
 *
 * All storage keys, default values, and presets for the flashcard plugin.
 */

import type {
  CardTemplate,
  DeckSettings,
  CardState,
  SpacedRepetitionPreset,
} from './types';

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  // Core data
  DECKS: 'chaycards/core-flashcards:decks',
  CARDS: 'chaycards/core-flashcards:cards',
  TEMPLATES: 'chaycards/core-flashcards:templates',

  // Study data
  SESSIONS: 'chaycards/core-flashcards:sessions',
  STATISTICS: 'chaycards/core-flashcards:statistics',
  USER_STATS: 'chaycards/core-flashcards:user-stats',

  // Settings
  GLOBAL_SETTINGS: 'chaycards/core-flashcards:global-settings',
  ACTIVE_DECKS: 'chaycards/core-flashcards:active-decks',

  // Media files (uses Files as Entity Properties pattern)
  // Actual key format: 'chaycards/core-flashcards:media:card-{cardId}:{fieldName}'
  MEDIA_PREFIX: 'chaycards/core-flashcards:media',
} as const;

// ============================================================================
// SM-2 ALGORITHM DEFAULTS
// ============================================================================

export const SM2_DEFAULTS = {
  // Initial values for new cards
  STARTING_EASE: 2.5,          // 250%
  INITIAL_INTERVAL: 1,         // 1 day

  // Grade multipliers
  AGAIN_MULTIPLIER: 0.0,       // Reset to start
  HARD_MULTIPLIER: 1.2,        // 120%
  GOOD_MULTIPLIER: 2.5,        // 250% (starting ease)
  EASY_MULTIPLIER: 4.0,        // 400%

  // Ease factor adjustments
  EASE_AGAIN_PENALTY: -0.2,    // -20% for "Again"
  EASE_HARD_PENALTY: -0.15,    // -15% for "Hard"
  EASE_EASY_BONUS: 0.15,       // +15% for "Easy"
  MIN_EASE: 1.3,               // 130% minimum

  // Interval limits
  MIN_INTERVAL: 1,             // 1 day
  MAX_INTERVAL: 36500,         // ~100 years

  // Learning steps (minutes)
  NEW_CARD_STEPS: [1, 10],     // 1 min, 10 min
  RELEARNING_STEPS: [10],      // 10 min

  // Graduation intervals
  GRADUATING_INTERVAL: 1,      // 1 day
  EASY_INTERVAL: 4,            // 4 days

  // Lapse settings
  NEW_INTERVAL_PERCENTAGE: 0.0, // Reset to 0% on lapse
  MINIMUM_LAPSE_INTERVAL: 1,    // 1 day
  LEECH_THRESHOLD: 8,           // 8 lapses = leech
} as const;

// ============================================================================
// SPACED REPETITION PRESETS
// ============================================================================

export const SR_PRESETS: Record<SpacedRepetitionPreset, Omit<DeckSettings, 'algorithm' | 'preset'>> = {
  relaxed: {
    // New card steps
    newCardSteps: [1, 10, 1440],       // 1min, 10min, 1day
    graduatingInterval: 3,              // 3 days
    easyInterval: 7,                    // 7 days

    // Ease settings
    startingEase: 250,                  // 250%
    easyBonus: 150,                     // 150%
    intervalModifier: 120,              // 120% (longer intervals)
    maxInterval: 36500,
    hardInterval: 100,                  // 100% (same as previous)

    // Lapse settings
    relearningSteps: [10, 1440],       // 10min, 1day
    newInterval: 50,                    // 50% of previous
    minimumInterval: 2,                 // 2 days
    leechThreshold: 8,

    // Daily limits
    newCardsPerDay: 10,
    reviewsPerDay: 100,

    // Display
    showHints: true,
    autoPlayAudio: true,
    randomizeCardOrder: false,

    // Advanced
    enableReverseCards: false,
    buryRelatedCards: true,
  },

  balanced: {
    // New card steps
    newCardSteps: [1, 10],
    graduatingInterval: 1,
    easyInterval: 4,

    // Ease settings
    startingEase: 250,
    easyBonus: 130,
    intervalModifier: 100,              // 100% (standard)
    maxInterval: 36500,
    hardInterval: 120,                  // 120%

    // Lapse settings
    relearningSteps: [10],
    newInterval: 0,                     // Reset to 0%
    minimumInterval: 1,
    leechThreshold: 8,

    // Daily limits
    newCardsPerDay: 20,
    reviewsPerDay: 200,

    // Display
    showHints: true,
    autoPlayAudio: true,
    randomizeCardOrder: false,

    // Advanced
    enableReverseCards: false,
    buryRelatedCards: true,
  },

  intense: {
    // New card steps
    newCardSteps: [1, 10],
    graduatingInterval: 1,
    easyInterval: 3,

    // Ease settings
    startingEase: 250,
    easyBonus: 130,
    intervalModifier: 80,               // 80% (shorter intervals)
    maxInterval: 365,                   // 1 year max
    hardInterval: 120,

    // Lapse settings
    relearningSteps: [10],
    newInterval: 0,
    minimumInterval: 1,
    leechThreshold: 4,                  // More aggressive leech detection

    // Daily limits
    newCardsPerDay: 50,
    reviewsPerDay: 500,

    // Display
    showHints: false,                   // No hints for intense study
    autoPlayAudio: true,
    randomizeCardOrder: true,           // Add variety

    // Advanced
    enableReverseCards: false,
    buryRelatedCards: false,            // Show related cards too
  },

  custom: {
    // User will customize all settings
    newCardSteps: [1, 10],
    graduatingInterval: 1,
    easyInterval: 4,
    startingEase: 250,
    easyBonus: 130,
    intervalModifier: 100,
    maxInterval: 36500,
    hardInterval: 120,
    relearningSteps: [10],
    newInterval: 0,
    minimumInterval: 1,
    leechThreshold: 8,
    newCardsPerDay: 20,
    reviewsPerDay: 200,
    showHints: true,
    autoPlayAudio: true,
    randomizeCardOrder: false,
    enableReverseCards: false,
    buryRelatedCards: true,
  },
};

// ============================================================================
// DEFAULT CARD STATE (New Cards)
// ============================================================================

export const DEFAULT_CARD_STATE: CardState = {
  easeFactor: SM2_DEFAULTS.STARTING_EASE,
  interval: 0,
  dueDate: Date.now(),
  reviewCount: 0,
  lapseCount: 0,
  stage: 'new',
  learningStep: 0,
};

// ============================================================================
// BUILT-IN TEMPLATES
// ============================================================================

export const BUILT_IN_TEMPLATES: CardTemplate[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Simple front and back card',
    icon: '📝',
    category: 'General',

    fields: [
      {
        name: 'Front',
        type: 'richtext',
        required: true,
        placeholder: 'Question or prompt',
        interaction: {
          type: 'display',
          settings: { type: 'display' },
        },
      },
      {
        name: 'Back',
        type: 'richtext',
        required: true,
        placeholder: 'Answer',
        interaction: {
          type: 'display',
          settings: { type: 'display' },
        },
      },
    ],

    front: `
<div class="card-front">
  <div class="field-content">{{Front}}</div>
</div>
    `.trim(),

    back: `
<div class="card-back">
  <div class="field-content">{{Back}}</div>
</div>
    `.trim(),

    css: `
.card-front, .card-back {
  font-family: var(--font-sans);
  font-size: 20px;
  text-align: center;
  padding: 40px 20px;
  color: var(--foreground);
  background: var(--background);
}

.field-label {
  font-size: 14px;
  color: var(--muted-foreground);
  text-transform: uppercase;
  margin-bottom: 10px;
}

.field-content {
  font-size: 24px;
  line-height: 1.5;
  color: var(--foreground);
}
    `.trim(),

    tags: ['basic', 'general'],
    isBuiltIn: true,
    isPublic: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'basic-type-answer',
    name: 'Basic (Type Answer)',
    description: 'Front and back with typed answer validation',
    icon: '⌨️',
    category: 'General',

    fields: [
      {
        name: 'Front',
        type: 'richtext',
        required: true,
        placeholder: 'Question',
        interaction: {
          type: 'display',
          settings: { type: 'display' },
        },
      },
      {
        name: 'Back',
        type: 'text',
        required: true,
        placeholder: 'Answer',
        interaction: {
          type: 'type-answer',
          settings: {
            type: 'type-answer',
            caseSensitive: false,
            ignorePunctuation: true,
            acceptTypos: true,
            typoThreshold: 2,
            showTypedAnswer: true,
            highlightDifferences: true,
          },
        },
      },
    ],

    front: `
<div class="card-front">
  <div class="question">{{Front}}</div>
  <div class="type-answer-input">
    <input type="text" placeholder="Type your answer..." />
  </div>
</div>
    `.trim(),

    back: `
<div class="card-back">
  <div class="question">{{Front}}</div>
  <div class="correct-answer">
    <div class="label">Correct Answer:</div>
    <div class="answer">{{Back}}</div>
  </div>
  <div class="typed-answer">
    <div class="label">Your Answer:</div>
    <div class="answer"></div>
  </div>
</div>
    `.trim(),

    css: `
.card-front, .card-back {
  font-family: var(--font-sans);
  padding: 40px 20px;
  color: var(--foreground);
  background: var(--background);
}

.question {
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
  color: var(--foreground);
}

.type-answer-input {
  margin-top: 30px;
}

.type-answer-input input {
  width: 100%;
  padding: 12px;
  font-size: 18px;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--input);
  color: var(--foreground);
}

.type-answer-input input:focus {
  outline: none;
  border-color: var(--ring);
}

.label {
  font-size: 14px;
  color: var(--muted-foreground);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.correct-answer, .typed-answer {
  margin: 20px 0;
}

.answer {
  font-size: 20px;
  font-weight: bold;
  color: var(--foreground);
}

.match { color: var(--success); }
.mismatch { color: var(--destructive); }
    `.trim(),

    tags: ['basic', 'type-answer', 'interactive'],
    isBuiltIn: true,
    isPublic: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'cloze',
    name: 'Cloze Deletion',
    description: 'Fill-in-the-blank with {{c1::deletions}}',
    icon: '🕳️',
    category: 'General',

    fields: [
      {
        name: 'Text',
        type: 'cloze',
        required: true,
        placeholder: 'The {{c1::mitochondria}} is the powerhouse of the {{c2::cell}}',
        interaction: {
          type: 'reveal-cloze',
          settings: {
            type: 'reveal-cloze',
            revealOneAtATime: true,
            showHints: true,
            hintCharacterCount: 1,
          },
        },
      },
      {
        name: 'Extra',
        type: 'richtext',
        required: false,
        placeholder: 'Additional context (optional)',
        interaction: {
          type: 'display',
          settings: { type: 'display' },
        },
      },
    ],

    front: `
<div class="cloze-card">
  <div class="cloze-text">{{Text}}</div>
  {{#Extra}}
  <div class="extra-info">{{Extra}}</div>
  {{/Extra}}
</div>
    `.trim(),

    back: `
<div class="cloze-card">
  <div class="cloze-text revealed">{{Text}}</div>
  {{#Extra}}
  <div class="extra-info">{{Extra}}</div>
  {{/Extra}}
</div>
    `.trim(),

    css: `
.cloze-card {
  font-family: var(--font-sans);
  font-size: 20px;
  padding: 40px 20px;
  line-height: 1.8;
  color: var(--foreground);
  background: var(--background);
}

.cloze-text {
  text-align: center;
}

.cloze {
  display: inline-block;
  padding: 2px 12px;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.cloze:hover {
  opacity: 0.9;
}

.cloze.revealed {
  background: var(--success);
  color: var(--success-foreground);
}

.extra-info {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  font-size: 16px;
  color: var(--muted-foreground);
}
    `.trim(),

    tags: ['cloze', 'fill-in-blank', 'interactive'],
    isBuiltIn: true,
    isPublic: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'language',
    name: 'Language Card',
    description: 'Vocabulary with pronunciation and audio',
    icon: '🌍',
    category: 'Language',

    fields: [
      {
        name: 'Word',
        type: 'text',
        required: true,
        placeholder: 'Foreign language word',
      },
      {
        name: 'Pronunciation',
        type: 'text',
        required: false,
        placeholder: 'IPA or phonetic spelling',
      },
      {
        name: 'Audio',
        type: 'media',
        required: false,
        accepts: ['audio/*'],
        interaction: {
          type: 'display',
          settings: {
            type: 'display',
            autoPlayAudio: true,
          },
        },
      },
      {
        name: 'Translation',
        type: 'text',
        required: true,
        placeholder: 'Meaning in your language',
      },
      {
        name: 'Example',
        type: 'richtext',
        required: false,
        placeholder: 'Example sentence (optional)',
      },
    ],

    front: `
<div class="language-card">
  <div class="word">{{Word}}</div>
  {{#Pronunciation}}
  <div class="pronunciation">[{{Pronunciation}}]</div>
  {{/Pronunciation}}
  {{#Audio}}
  <audio src="{{Audio}}" autoplay></audio>
  {{/Audio}}
</div>
    `.trim(),

    back: `
<div class="language-card">
  <div class="word">{{Word}}</div>
  {{#Pronunciation}}
  <div class="pronunciation">[{{Pronunciation}}]</div>
  {{/Pronunciation}}
  <div class="translation">{{Translation}}</div>
  {{#Example}}
  <div class="example">
    <div class="example-label">Example:</div>
    <div class="example-text">{{Example}}</div>
  </div>
  {{/Example}}
  {{#Audio}}
  <audio src="{{Audio}}" controls></audio>
  {{/Audio}}
</div>
    `.trim(),

    css: `
.language-card {
  font-family: var(--font-sans);
  text-align: center;
  padding: 40px 20px;
  color: var(--foreground);
  background: var(--background);
}

.word {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--foreground);
}

.pronunciation {
  font-size: 18px;
  color: var(--muted-foreground);
  font-style: italic;
  margin-bottom: 20px;
}

.translation {
  font-size: 24px;
  color: var(--primary);
  margin: 20px 0;
}

.example {
  margin-top: 30px;
  padding: 20px;
  background: var(--muted);
  border-radius: 8px;
  text-align: left;
}

.example-label {
  font-size: 12px;
  color: var(--muted-foreground);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.example-text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--foreground);
}

audio {
  margin-top: 20px;
}
    `.trim(),

    tags: ['language', 'vocabulary', 'audio'],
    isBuiltIn: true,
    isPublic: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'image-occlusion',
    name: 'Image Occlusion',
    description: 'Hide parts of an image to test knowledge',
    icon: '🖼️',
    category: 'Science',

    fields: [
      {
        name: 'Image',
        type: 'media',
        required: true,
        accepts: ['image/*'],
      },
      {
        name: 'Question',
        type: 'text',
        required: false,
        placeholder: 'What is highlighted? (optional)',
      },
      {
        name: 'Answer',
        type: 'text',
        required: false,
        placeholder: 'Label or explanation (optional)',
      },
    ],

    front: `
<div class="image-occlusion-card">
  {{#Question}}
  <div class="question">{{Question}}</div>
  {{/Question}}
  <div class="image-container">
    <img src="{{Image}}" alt="Study image" />
    <svg class="occlusion-overlay"></svg>
  </div>
</div>
    `.trim(),

    back: `
<div class="image-occlusion-card">
  {{#Question}}
  <div class="question">{{Question}}</div>
  {{/Question}}
  <div class="image-container">
    <img src="{{Image}}" alt="Study image" />
  </div>
  {{#Answer}}
  <div class="answer">{{Answer}}</div>
  {{/Answer}}
</div>
    `.trim(),

    css: `
.image-occlusion-card {
  font-family: var(--font-sans);
  padding: 20px;
  text-align: center;
  color: var(--foreground);
  background: var(--background);
}

.question {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--foreground);
}

.image-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.image-container img {
  max-width: 100%;
  height: auto;
  display: block;
}

.occlusion-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.occlusion-rect {
  fill: hsl(var(--foreground) / 0.8);
  cursor: pointer;
  pointer-events: auto;
  transition: opacity 0.3s;
}

.occlusion-rect:hover {
  opacity: 0.6;
}

.answer {
  margin-top: 20px;
  font-size: 18px;
  color: var(--success);
  font-weight: bold;
}
    `.trim(),

    tags: ['image', 'visual', 'science', 'anatomy'],
    isBuiltIn: true,
    isPublic: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ============================================================================
// DEFAULT DECK STATS
// ============================================================================

export const DEFAULT_DECK_STATS = {
  totalCards: 0,
  newCards: 0,
  learningCards: 0,
  reviewCards: 0,
  dueToday: 0,
  masteredCards: 0,
  averageRetention: 0,
  averageEase: SM2_DEFAULTS.STARTING_EASE,
  totalStudyTime: 0,
  currentStreak: 0,
  longestStreak: 0,
};

// ============================================================================
// STUDY MODE CONFIGS
// ============================================================================

export const STUDY_MODE_CONFIGS = {
  'spaced-repetition': {
    name: 'Spaced Repetition',
    description: 'Smart scheduling based on your performance',
    icon: '🧠',
    modifiesSchedule: true,
  },
  'cram': {
    name: 'Cram All Cards',
    description: 'Review all cards without affecting schedule',
    icon: '⚡',
    modifiesSchedule: false,
  },
  'cram-seen': {
    name: 'Cram Seen Cards',
    description: 'Review only cards you\'ve studied before',
    icon: '🔄',
    modifiesSchedule: false,
  },
  'shuffle': {
    name: 'Shuffle Mode',
    description: 'Random order review of all cards',
    icon: '🔀',
    modifiesSchedule: false,
  },
  'match': {
    name: 'Match Game',
    description: 'Match terms with definitions',
    icon: '🎮',
    modifiesSchedule: false,
  },
  'type-race': {
    name: 'Type Race',
    description: 'Type answers before timer runs out',
    icon: '⏱️',
    modifiesSchedule: false,
  },
  'memory-grid': {
    name: 'Memory Grid',
    description: 'Flip and match cards',
    icon: '🃏',
    modifiesSchedule: false,
  },
  'write': {
    name: 'Write Mode',
    description: 'Practice writing all answers',
    icon: '✍️',
    modifiesSchedule: false,
  },
} as const;

// ============================================================================
// CARD GRADES
// ============================================================================

export const GRADE_LABELS = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
} as const;

export const GRADE_COLORS = {
  1: 'var(--destructive)',  // Again (Red)
  2: 'var(--warning)',      // Hard (Orange/Yellow)
  3: 'var(--success)',      // Good (Green)
  4: 'var(--primary)',      // Easy (Blue)
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION = {
  MAX_FIELD_NAME_LENGTH: 50,
  MAX_TEMPLATE_NAME_LENGTH: 100,
  MAX_DECK_NAME_LENGTH: 200,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_PER_CARD: 20,
  MAX_FIELDS_PER_TEMPLATE: 20,
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 5.0,
} as const;
