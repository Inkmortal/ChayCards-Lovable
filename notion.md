# Notion MCP Guide for Claude

## Critical Information
- **Database Name**: ChayCards_Dev
- **Database ID**: `1fcbbd9b-1a29-8037-93a7-f8088c952035`
- **Data Source ID**: `1fcbbd9b-1a29-80d5-bc07-000be692a8ea`
- **Purpose**: Track tasks persistently across sessions, communicate progress to human

## Creating Tasks

When human asks to create a task, use:
```
mcp__notion__notion-create-pages
- parent: {"type": "data_source_id", "data_source_id": "1fcbbd9b-1a29-80d5-bc07-000be692a8ea"}
- pages: [{"properties": {
    "Project name": "Task title here",
    "Status": "Not started",  // "Not started", "In progress", "Done"
    "Priority": "High",       // "High", "Medium", "Low"
    "Category": "Plugin System"  // "Infrastructure", "Planning", "Plugin System", "Core Plugins", "Backend", "Testing"
  }, "content": "Notion-flavored Markdown content here"}]
```

## Content Format

Tasks use **Notion-flavored Markdown** directly in the content field during creation:
```
- pages: [{"properties": {...}, "content": "# About Project\nDescription\n\n# Action items\n- First task\n- Second task"}]
```

**No separate block creation needed** - content is rendered automatically.

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
mcp__notion__notion-search
- query: ""
- data_source_url: "collection://1fcbbd9b-1a29-80d5-bc07-000be692a8ea"
- filters: {
    "created_by_user_ids": [],
    "created_date_range": {"start_date": "2024-01-01"}
  }
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
mcp__notion__notion-update-page
- data: {
    "page_id": "[task_id]",
    "command": "update_properties",
    "properties": {"Status": "In progress"}  // or "Done"
  }
```

### Update Content:
```
mcp__notion__notion-update-page
- data: {
    "page_id": "[task_id]",
    "command": "replace_content",
    "new_str": "Updated Notion-flavored Markdown content"
  }
```

### Add Dependencies:
```
mcp__notion__notion-update-page
- data: {
    "page_id": "[task_id]",
    "command": "update_properties",
    "properties": {"Dependencies": ["dependent_task_url"]}
  }
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