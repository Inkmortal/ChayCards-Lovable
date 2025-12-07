# Memory Bank Management Pattern

**Category:** Infrastructure
**Type:** AI Agent Guidelines
**Triggers:** session management, context management, progress tracking, feature tracking

## Purpose

Guidelines for Claude Code to effectively use the memory-bank system for long-running agent operations. Based on [Anthropic's engineering research on effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents).

## Core Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `memory-bank/core/activeContext.md` | Session state & progress | Every session |
| `memory-bank/product-management/features.json` | Feature verification tracking | When features change |
| `memory-bank/core/projectbrief.md` | Project overview (stable) | Rarely |

## Active Context Rules

### Keep It Lean

The `activeContext.md` file is injected into EVERY prompt. Keep it focused:

**DO Include:**
- Current branch and focus area
- Tasks completed THIS session (move to history after session ends)
- Active blockers
- Key technical decisions made recently
- Environment-specific notes

**DON'T Include:**
- Full implementation details (that's what code is for)
- Historical sessions older than 1-2 sessions
- Duplicate information from other memory-bank files
- Long code snippets

### Update Protocol

```markdown
## At Session Start
1. Review "In Progress" items - are they still relevant?
2. Clear completed items from "In Progress"
3. Update "Current Focus" to match actual work

## During Session
- Mark items [x] as completed immediately
- Add new blockers as discovered
- Note key technical decisions

## At Session End
1. Move "Recently Completed" items to a dated section
2. Update "Next Session Priorities"
3. Clear stale blockers
4. Update timestamp
```

## Task Completion Triggers

**IMPORTANT**: Update memory bank proactively when:

| Trigger | Action |
|---------|--------|
| Task completed | Move to "Recently Completed" in activeContext.md |
| Feature finished | Update features.json status |
| Bug fixed | Move bug file to `resolved/` |
| Pattern discovered | Create/update pattern in `patterns/` |
| Major decision made | Add to "Technical Decisions Made" |
| Blocker resolved | Remove from "Blockers" |

### Auto-Update Checklist

After completing any significant work, ask yourself:
- [ ] Is activeContext.md current?
- [ ] Does features.json reflect the change?
- [ ] Should a pattern be documented?
- [ ] Are there stale blockers to clear?

### When Prompted to Act

When the user asks you to implement something:
1. **Before**: Check memory bank for existing patterns/implementations
2. **During**: Track progress in "In Progress" section
3. **After**: Update "Recently Completed" and clear from "In Progress"

This ensures continuity across context resets.

### Maximum Sizes

- **Recently Completed**: 5-7 items max (oldest fall off)
- **In Progress**: 3-5 items max (focus!)
- **Blockers**: Only active ones
- **Technical Decisions**: Last 3-5 significant decisions

## Feature Tracking (features.json)

### Structure

```json
{
  "id": "unique-feature-id",
  "category": "core|plugins|infrastructure|ui",
  "name": "Human readable name",
  "status": "planned|in-progress|complete",
  "verified": false,
  "notes": "Brief context"
}
```

### Status Rules

| Status | Meaning | Verification |
|--------|---------|--------------|
| `planned` | Spec exists, not started | N/A |
| `in-progress` | Active development | `verified: false` |
| `complete` | Code done | Must verify with Puppeteer |

### Verification Protocol

**CRITICAL**: Never mark `verified: true` without end-to-end testing!

```markdown
1. Feature code is complete
2. Run Puppeteer MCP to test the feature visually
3. Confirm expected behavior in screenshot
4. ONLY THEN set "verified": true
```

### Searching Features

To find features by status:
```javascript
// In Node.js or hook code
const features = require('./memory-bank/product-management/features.json');

// Find incomplete features
const incomplete = features.features.filter(f => f.status !== 'complete' || !f.verified);

// Find by category
const plugins = features.features.filter(f => f.category === 'plugins');
```

For Claude Code queries:
- "What features are in progress?" → Read features.json, filter by status
- "What needs verification?" → Filter where `status === 'complete'` but `verified === false`

## Session Handoff Pattern

When context window is running low or session ends:

```markdown
1. Update activeContext.md with:
   - What was accomplished
   - What's still in progress
   - Any blockers discovered
   - Key decisions made

2. Commit changes:
   git add memory-bank/core/activeContext.md
   git commit -m "docs: update session state"

3. Next session starts by reading activeContext.md
   (automatically injected by RAG hook)
```

## Anti-Patterns

### Don't Do This

1. **Bloated activeContext.md**
   - ❌ Including full file contents
   - ❌ Keeping months of history
   - ❌ Duplicating CLAUDE.md content

2. **Premature Feature Completion**
   - ❌ Marking `verified: true` without Puppeteer test
   - ❌ Setting `status: complete` with known bugs

3. **Stale State**
   - ❌ Leaving old "In Progress" items
   - ❌ Not updating timestamps
   - ❌ Blockers that were resolved but not cleared

4. **Over-documenting**
   - ❌ Every minor change in activeContext
   - ❌ Implementation details that belong in code comments

## Integration with RAG Hook

The RAG hook (`user-prompt-submit.cjs`) automatically:

1. **Always injects** `activeContext.md` as `<session-state>` block
2. **Then searches** Qdrant for semantically relevant patterns
3. **LLM curates** the search results via tool calling

This means:
- Session state is ALWAYS available (no embedding needed)
- Patterns are retrieved based on prompt relevance
- Keep activeContext.md small since it's injected every time

## File Locations

```
memory-bank/
├── core/
│   ├── activeContext.md    # Session state (always injected)
│   └── projectbrief.md     # Project overview
├── patterns/
│   └── memory-bank-management.md  # This file
├── product-management/
│   ├── features.json       # Feature tracking
│   ├── bugs/
│   │   ├── open/
│   │   └── resolved/
│   └── features/
│       ├── completed/
│       ├── in-progress/
│       └── planned/
├── docs/                   # Architecture & feature specs
└── tools/                  # MCP & agent guides
```