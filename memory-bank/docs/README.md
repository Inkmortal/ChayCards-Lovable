# Documentation Directory

This directory contains technical documentation that is embedded in the vector database for semantic retrieval.

## Content

Technical documentation files that provide deep context on:
- Data models and schemas
- System architecture
- API specifications
- Implementation details
- Design decisions

## Difference from Patterns

**Patterns** (`/patterns/`) = Short, actionable, code-focused
**Docs** (`/docs/`) = Comprehensive, explanatory, context-focused

### Patterns
- Code examples with implementations
- "Do this, not that" guidance
- File:line references
- Quick reference format

### Docs
- Deep explanations of WHY
- System design reasoning
- Complete specifications
- Architectural context

## Examples

### Should be in `/patterns/`:
- "Files as Entity Properties API usage"
- "Plugin registration steps"
- "Storage adapter pattern"

### Should be in `/docs/`:
- FILE_STORAGE_IMPLEMENTATION.md (full spec)
- DOCUMENTS_DATA_MODEL.md (complete model)
- PLUGIN_ARCHITECTURE.md (design decisions)

## Embedding

Both patterns and docs are embedded in Qdrant, but serve different purposes:
- **Patterns** retrieved for "how to" questions
- **Docs** retrieved for "why/what is" questions
- LLM compresses both into minimal reminders

## Adding Documentation

1. Create markdown file with clear title
2. Provide comprehensive explanations
3. Include diagrams/examples where helpful
4. Link to related patterns
5. Keep up-to-date with code changes

Documentation is re-embedded automatically by the background watcher.
