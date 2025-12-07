# Subdirectory CLAUDE.md Pattern

**Category:** Infrastructure
**Type:** AI Agent Guidelines
**Triggers:** directory context, file structure, subdirectory claude, nested context

## Purpose

Create lean CLAUDE.md files in subdirectories to provide localized context. These supplement root CLAUDE.md with directory-specific patterns.

## Template

```markdown
# [Directory] Context

## Purpose
One-line description.

## Structure
directory/
├── subdir/       # Brief desc
└── file.ts       # Brief desc

## Key Patterns
- Pattern 1
- Pattern 2

## Important Files
- `file.ts`: Why it matters
```

## Keep It Lean

| Section | Max |
|---------|-----|
| Purpose | 2 sentences |
| Structure | 15-20 entries |
| Key Patterns | 5 bullets |
| Important Files | 5 entries |

**Target: <80 lines per file**

### DO Include
- Directory purpose (1-2 sentences)
- File tree with brief descriptions
- Directory-specific patterns
- Links to memory-bank docs

### DON'T Include
- Full API docs (link instead)
- Duplicate root CLAUDE.md content
- Every single file
- Implementation details

## When to Update

Update subdirectory CLAUDE.md when:
- New significant file added
- Directory restructured
- Patterns change
- After major refactoring

## Recommended Locations

| Directory | Why |
|-----------|-----|
| `src/plugins/` | Plugin conventions |
| `src/renderer/components/` | Component patterns |
| `electron/` | IPC patterns |

## Integration

- Embedded into Qdrant (not always-injected)
- Retrieved when prompts relate to that directory
- Keeps root CLAUDE.md focused on project-wide concerns
