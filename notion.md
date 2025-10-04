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

### CRITICAL: Status Property Values
When the human mentions status terms, they refer to the **literal Status property values** in Notion:
- **"Not started"** = Status property equals "Not started"
- **"In progress"** = Status property equals "In progress"
- **"Backlog"** = Status property equals "Backlog"
- **"In Review"** = Status property equals "In Review"
- **"Done"** = Status property equals "Done"

**ALWAYS filter by Status property** when human mentions these terms to save context and get exactly what they mean.

### How to Query by Status (HYBRID APPROACH)

**The MCP server doesn't expose database queries** - use this two-step hybrid flow:

**Step 1: Query with Official Notion API (curl)**
```bash
curl -X POST https://api.notion.com/v1/databases/1fcbbd9b-1a29-8037-93a7-f8088c952035/query \
  -H "Authorization: Bearer ${NOTION_API_KEY}" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "Status",
      "status": {"equals": "In progress"}
    }
  }'
```

This returns an array of page objects with IDs like:
```json
{"results": [
  {"id": "280bbd9b-1a29-8166-b3a6-d82d29898b58", "properties": {...}},
  {"id": "280bbd9b-1a29-8175-b6b2-f141a5aea2b4", "properties": {...}}
]}
```

**Step 2: Fetch Full Details with MCP**
Use the page IDs from Step 1 to get complete content:
```
mcp__notion__notion-fetch
- id: "280bbd9b-1a29-8166-b3a6-d82d29898b58"
```

Returns full page with Notion-flavored Markdown content, properties, and acceptance criteria.

### Why Hybrid?
- **curl**: Official API supports property filtering (Status, Priority, etc.)
- **MCP fetch**: Returns rich formatted content (checkboxes, sections, full details)
- **MCP**: Limited to basic tools (search, fetch, create, update) - no query/filter

### Complete Example: "Show me tasks in progress"

```bash
# Step 1: Query by Status via API
curl -X POST https://api.notion.com/v1/databases/1fcbbd9b-1a29-8037-93a7-f8088c952035/query \
  -H "Authorization: Bearer ${NOTION_API_KEY}" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter": {"property": "Status", "status": {"equals": "In progress"}}}'

# Returns 3 task IDs:
# - 280bbd9b-1a29-8166-b3a6-d82d29898b58 (Refactor electron/main.cjs)
# - 280bbd9b-1a29-8175-b6b2-f141a5aea2b4 (Centralize Plugin Storage Key)
# - 280bbd9b-1a29-81bc-b1fb-e46e3d4b06c9 (Standardize Platform Detection)
```

Then fetch details for each:
```
mcp__notion__notion-fetch
- id: "280bbd9b-1a29-81bc-b1fb-e46e3d4b06c9"
```

Returns full task with acceptance criteria, problem description, solution steps.

## Updating Tasks

### CRITICAL RULE: Status Changes
**Claude MUST NOT change task Status property** - Only the human can move tasks between statuses.

**Status workflow:**
- "Not started" → "In progress": Human only
- "In progress" → "In Review": Claude MAY do this, but MUST ask human first
- "In Review" → "Done": Human only

**NEVER move directly to "Done"** - Tasks must go through "In Review" first and await human approval.

Claude IS ALLOWED to:
- Update checkboxes in task content for progress tracking
- Add notes and implementation details
- Update acceptance criteria checkboxes
- Ask to move task to "In Review" when work is complete

### Update Checkboxes (ALLOWED):
```
mcp__notion__notion-update-page
- data: {
    "page_id": "[task_id]",
    "command": "replace_content",
    "new_str": "Updated content with checked boxes: [x]"
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

Every task MUST have at minimum 3 checkboxes for progress tracking.

Required sections:
1. **Problem** - What's wrong and why it needs fixing
2. **Affected Files** (optional) - File paths and line numbers
3. **Solution** - How to fix it with code examples
4. **Acceptance Criteria** - Definition of done with checkboxes (MINIMUM 3)
5. **Impact** - Why this matters and estimated scope

Example structure:
```
### Problem
Description of the issue

### Solution
Step-by-step fix

### Acceptance Criteria
- [ ] Checkbox 1
- [ ] Checkbox 2
- [ ] Checkbox 3
- [ ] Checkbox 4 (if needed)

### Impact
Why this matters
```

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
1. Check off completed acceptance criteria checkboxes
2. **DO NOT change task Status** - only human changes status
3. Add implementation notes to task content

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