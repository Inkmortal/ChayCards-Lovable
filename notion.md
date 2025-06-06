# Notion MCP Guide for Claude

## Critical Information
- **Database Name**: ChayCards_Dev
- **Database ID**: `1fcbbd9b-1a29-8037-93a7-f8088c952035`
- **Purpose**: Track tasks persistently across sessions, communicate progress to human

## Creating Tasks

When human asks to create a task, use:
```
mcp__notion__API-post-page
- parent: {"database_id": "1fcbbd9b-1a29-8037-93a7-f8088c952035"}
- properties: {
    "Project name": {"title": [{"text": {"content": "Task title here"}}]},
    "Status": {"status": {"name": "Not started"}},
    "Priority": {"select": {"name": "High"}},  // High, Medium, or Low
    "Category": {"select": {"name": "Plugin System"}}  // Infrastructure, Plugin System, Core Plugins, Backend, Testing
  }
```

## Adding Task Content

After creating task, add content with proper Notion blocks:

```
mcp__notion__API-patch-block-children
- block_id: [page_id from creation]
- children: [
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "About project"}}]}},
    {"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": "Description here"}}]}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "Action items"}}]}},
    {"type": "to_do", "to_do": {"rich_text": [{"type": "text", "text": {"content": "First task"}}], "checked": false}},
    {"type": "to_do", "to_do": {"rich_text": [{"type": "text", "text": {"content": "Second task"}}], "checked": false}}
  ]
```

## CRITICAL FORMATTING RULES

### ✅ CORRECT:
- Use `heading_3` blocks for sections
- Use `to_do` blocks for action items
- Use `paragraph` blocks for text
- Use proper Notion block structure

### ❌ WRONG:
- NO markdown syntax (##, *, -)
- NO `bulleted_list_item` for action items
- NO plain text headers
- NO escaped quotes in content

## Querying Tasks

To see all incomplete tasks (default):
```
mcp__notion__API-post-database-query
- database_id: "1fcbbd9b-1a29-8037-93a7-f8088c952035"
- filter: {
    "or": [
      {"property": "Status", "status": {"equals": "Not started"}},
      {"property": "Status", "status": {"equals": "In progress"}}
    ]
  }
- sorts: [{"property": "Priority", "direction": "ascending"}]
```

To filter by specific status:
```
- filter: {"property": "Status", "status": {"equals": "In progress"}}
```

To see all tasks (including completed):
```
mcp__notion__API-post-database-query
- database_id: "1fcbbd9b-1a29-8037-93a7-f8088c952035"
- sorts: [{"property": "Priority", "direction": "ascending"}]
```

## Updating Tasks

### Change Status:
```
mcp__notion__API-patch-page
- page_id: [task_id]
- properties: {"Status": {"status": {"name": "In progress"}}}  // or "Done"
```

### Check Off Action Items:
```
mcp__notion__API-update-a-block
- block_id: [to_do_block_id]
- type: {"to_do": {"rich_text": [existing_text], "checked": true}}
```

### Add Dependencies:
```
mcp__notion__API-patch-page
- page_id: [task_id]
- properties: {"Dependencies": {"relation": [{"id": "dependent_task_id"}]}}
```

## Standard Task Structure

Every task should have:
1. **About project** (heading_3) - What this accomplishes
2. **Technical Details** (heading_3) - Implementation notes
3. **Action items** (heading_3) - Checklist of steps (to_do blocks)
4. **Acceptance Criteria** (heading_3) - Definition of done (to_do blocks)

## Common Patterns

### When user says "add a task for X":
1. Create task with appropriate priority/category
2. Add structured content
3. Set dependencies if it requires other tasks first

### When user says "check tasks":
1. Query database
2. Report status, priority, and current action items
3. Highlight any blockers or dependencies

### When completing work:
1. Check off completed action items
2. Update task status
3. Add notes about what was implemented

## Error Prevention

1. **Always use database_id**, not page_id for parent when creating tasks
2. **Always use to_do blocks** for checklists, not bulleted_list_item
3. **Never use markdown syntax** - Notion doesn't parse it
4. **Check block exists** before trying to update it
5. **Use proper JSON structure** - no string concatenation

## Remember
- This database persists between sessions
- Human monitors this to track your progress
- Update frequently to maintain communication
- Tasks guide project development flow