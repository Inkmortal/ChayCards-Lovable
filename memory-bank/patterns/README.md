# Patterns Directory

This directory contains code patterns, architectural decisions, and implementation guidelines that are embedded in the vector database for semantic retrieval.

## Structure

Each pattern file includes:
- **Category** - Pattern classification (Storage, Plugins, UI, etc.)
- **Type** - Pattern type (Code Pattern, Architecture Pattern, Reminder, etc.)
- **Triggers** - Keywords that should trigger retrieval of this pattern
- **Content** - Actual pattern documentation with examples

## Pattern Types

### Code Patterns
Specific implementation patterns with code examples. Focus on HOW to implement something.

Example: `files-as-entity-properties.md`

### Architecture Patterns
High-level structural decisions. Focus on WHAT structure to use.

Example: `plugin-registry-pattern.md`

### Reminders
Brief reminders about functions/methods that exist to prevent duplication.

Example: "uploadFile() exists at DocumentsService.ts:342"

### Migration Guides
How to migrate from deprecated patterns to current ones.

Example: "Replace storage.setFile() with storage.set(key, data, {files})"

## Adding New Patterns

1. Create markdown file with descriptive name
2. Include Category, Type, and Triggers frontmatter
3. Provide clear examples with code
4. Reference existing implementations (file:line)
5. Call out deprecated patterns to avoid

## Embedding Process

Patterns are automatically embedded and stored in Qdrant:
- **Manual:** `npm run embed-patterns`
- **Auto:** Background watcher detects file changes

## Pattern Retrieval

When Claude Code receives a user prompt:
1. Prompt is embedded
2. Top 30 similar patterns retrieved from Qdrant
3. LLM compresses 30 patterns → minimal reminder
4. Compressed content injected into Claude Code context
