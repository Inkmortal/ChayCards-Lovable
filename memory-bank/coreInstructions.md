# Core Instructions - Permanent Reference

**IMPORTANT**: This file is PERMANENT and should NEVER be modified during normal development. It contains the foundational agent orchestration rules that all sessions must follow.

## 🚦 PRE-TASK CHECKLIST (Permanent - Do Not Modify)

**MANDATORY**: Main Claude must review this checklist before every task. If you skip this, you're not following project standards.

### Before Implementation
- [ ] Is this a new feature/component/function? → **STOP** → Delegate to `context-researcher` agent
- [ ] Am I about to write >20 lines of code? → **STOP** → Delegate to `context-researcher` agent
- [ ] Is this a complex feature (>3 files, >100 lines)? → **STOP** → Delegate to `context-researcher` agent
- [ ] Am I investigating architecture/patterns? → **STOP** → Delegate to `context-researcher` agent

### During Implementation
- [ ] Did I encounter an error/bug? → **STOP** → Delegate to `root-cause-debugger` agent
- [ ] Do I need to understand execution flow? → **STOP** → Delegate to `context-researcher` agent
- [ ] Do I need multi-step research? → **STOP** → Delegate to `general-purpose` agent

### After Implementation
- [ ] Did I just complete implementation? → **STOP** → Agent auto-chains to `code-reviewer`
- [ ] Did I just implement UI changes? → **STOP** → Delegate to `frontend-qa-tester` agent (after code-reviewer)
- [ ] Did I just refactor code? → **STOP** → Agent auto-chains to `code-cleanup-refactor`
- [ ] Are there tests to run? → **STOP** → Agent auto-chains to `test-runner-validator`

### Before Committing
- [ ] Am I about to commit changes? → **STOP** → Delegate to `security-reviewer` (if auth/data) then `git-workflow-manager`
- [ ] Ready to create commit? → **STOP** → Delegate to `git-workflow-manager` agent

### Project Management
- [ ] Did I complete a task? → **STOP** → Delegate to `backlog-manager` agent
- [ ] Did I make significant changes? → **STOP** → Agent auto-chains to `memory-bank-keeper`

**If Main Claude skips these checks, it's violating project policy.**

---

## Agent Workflow Chains (Auto-Executing)

These chains execute automatically - Main Claude only starts the first agent, then waits for the final summary.

### 🔨 Implementation Workflow
```
context-researcher
  ↓ (auto-calls)
memory-bank-keeper (documents findings in activeContext.md)
  ↓ (returns to)
context-researcher (returns summary to Main Claude)
  ↓ (Main Claude gets user approval, then delegates)
implementation
  ↓ (auto-calls)
code-reviewer
  ↓ (auto-calls if tests exist)
test-runner-validator (optional)
  ↓ (auto-calls)
memory-bank-keeper (documents results)
  ↓ (returns final summary to Main Claude)
```

**Main Claude involvement**:
- Start: Delegate to context-researcher
- Middle: Receive summary, get user approval, delegate to implementation
- End: Receive final summary, report to user

### 🐛 Debugging Workflow
```
root-cause-debugger
  ↓ (auto-calls)
memory-bank-keeper (documents root cause)
  ↓ (returns to)
root-cause-debugger (returns summary to Main Claude)
  ↓ (Main Claude gets user approval, then delegates)
implementation
  ↓ (auto-calls)
test-runner-validator (verify fix)
  ↓ (auto-calls)
code-reviewer
  ↓ (auto-calls)
memory-bank-keeper (documents results)
  ↓ (returns final summary to Main Claude)
```

**Main Claude involvement**:
- Start: Delegate to root-cause-debugger
- Middle: Receive root cause, get user approval for fix, delegate to implementation
- End: Receive final summary, report to user

### ♻️ Refactoring Workflow
```
context-researcher (understand current code + identify refactor opportunities)
  ↓ (auto-calls)
memory-bank-keeper
  ↓ (returns to Main Claude)
  ↓ (Main Claude gets user approval, then delegates)
implementation (perform refactor)
  ↓ (auto-calls)
code-cleanup-refactor (find unused code/artifacts)
  ↓ (auto-calls)
code-reviewer
  ↓ (auto-calls)
memory-bank-keeper
  ↓ (returns final summary to Main Claude)
```

**Main Claude involvement**:
- Start: Delegate to context-researcher
- Middle: Receive findings, get user approval, delegate to implementation
- End: Receive final summary, report to user

### 🧪 Testing Workflow
```
unit-test-generator (create tests)
  ↓ (auto-calls)
test-runner-validator (run tests)
  ↓ (auto-calls)
memory-bank-keeper (document results)
  ↓ (returns final summary to Main Claude)
```

**Main Claude involvement**:
- Start: Delegate to unit-test-generator
- End: Receive final summary, report to user

### 📦 Commit Workflow
```
security-reviewer (if auth/data/API changes - optional)
  ↓ (proceeds to)
git-workflow-manager (create commit)
  ↓ (auto-calls)
backlog-manager (update Notion tasks)
  ↓ (auto-calls)
memory-bank-keeper (document commit)
  ↓ (returns final summary to Main Claude)
```

**Main Claude involvement**:
- Start: Delegate to security-reviewer (if needed) or git-workflow-manager
- End: Receive final summary, report to user

### 🎨 UI Testing Workflow
```
frontend-qa-tester (test UI interactions)
  ↓ (auto-calls)
memory-bank-keeper (document test results)
  ↓ (returns final summary to Main Claude)
```

**Main Claude involvement**:
- Start: Delegate to frontend-qa-tester
- End: Receive final summary, report to user

---

## Zen MCP - Fallback Tool Only

**Zen is NOT part of standard workflows.** It is a manual tool for specific situations:

### When to Use Zen (User or Main Claude Decision)
- 🔄 **Stuck in loops**: Claude giving same responses repeatedly
- 😤 **User frustration**: User explicitly says "use zen" or "I'm frustrated"
- 🤔 **Need fresh perspective**: Tried multiple approaches, all failed
- 🧠 **Complex reasoning**: Need to think through a complex problem differently

### Available Zen Tools
- `chat` - Brainstorming, second opinion, fresh perspective
- `thinkdeep` - Multi-stage complex problem investigation
- `analyze` - Architecture/performance/security analysis
- `debug` - Root cause analysis (when root-cause-debugger isn't enough)
- `consensus` - Multi-model debate for decisions
- `challenge` - Force critical thinking when in reflexive agreement loop

### Zen is NOT for
- ❌ Standard implementation workflows
- ❌ Automated agent chains
- ❌ Primary research/debugging tools
- ❌ Replacing dedicated agents (context-researcher, code-reviewer, etc.)

**If unsure whether to use Zen**: Don't. Use the standard agent workflows first.

---

## Main Claude Decision Tree

When user makes a request, consult this tree:

### User Request Type → First Agent
- **"Implement X"** → context-researcher
- **"Add feature X"** → context-researcher
- **"Create component X"** → context-researcher
- **"Build X"** → context-researcher
- **"Fix bug X"** → root-cause-debugger
- **"Error: X"** → root-cause-debugger
- **"Not working: X"** → root-cause-debugger
- **"Why is X broken?"** → root-cause-debugger
- **"Refactor X"** → context-researcher (includes refactor opportunities)
- **"Clean up X"** → code-cleanup-refactor
- **"Generate tests for X"** → unit-test-generator
- **"Test X"** → frontend-qa-tester (UI) or test-runner-validator (unit tests)
- **"Ready to commit"** → git-workflow-manager
- **"Task complete"** → backlog-manager
- **"Update memory bank"** → memory-bank-keeper

### Special Cases
- **User says "use zen"** → Use appropriate Zen tool manually
- **User frustrated/stuck** → Offer to use Zen chat/thinkdeep
- **Need architectural decision** → Discuss with user, optionally use Zen consensus

### After Agent Chain Completes
1. Receive final summary from last agent in chain
2. Report compressed summary to user (2-3 sentences max)
3. Ask for user approval/input before next action
4. Never show code snippets to user unless explicitly requested

---

## Agent Communication Protocol

### How Agents Pass Context

**Via activeContext.md sections:**
- `## Current Work Focus` - Written by Main Claude when delegating
- `## Recent Changes` - Written by memory-bank-keeper from agent findings

**What agents pass to memory-bank-keeper:**
```json
{
  "action": "update activeContext.md",
  "section": "Recent Changes",
  "heading": "[Agent Name] - [Date]",
  "content": "Structured findings...",
  "files_referenced": ["path/to/file1.ts", "path/to/file2.ts"],
  "suggest_next_agent_read": ["path/to/relevant/file.ts"]
}
```

**What agents return to Main Claude:**
- Compressed summary (2-3 sentences max)
- Status indicator (✅/⚠️/❌)
- Next recommended action
- "Details documented in activeContext.md"

**Example return from context-researcher:**
```
"Found uploadFile() at DocumentsService.ts:342 using outdated API.
Files as Entity Properties pattern applies here.
Research documented in activeContext.md > Recent Changes."
```

### What Main Claude Never Does

❌ **NEVER**:
- Read code files directly
- Implement features itself
- Debug issues itself
- Update memory bank itself (memory-bank-keeper does this)
- Show full agent outputs to user (only compressed summaries)
- Call agents that aren't in standard workflows (except Zen as fallback)

✅ **ALWAYS**:
- Consult PRE-TASK CHECKLIST before every action
- Delegate to first agent in appropriate chain
- Wait for agent chain to complete
- Read only the final summary
- Report compressed summary to user
- Get user approval before next delegation
- Update activeContext.md "Current Work Focus" directly when delegating

---

## Context Efficiency Rules

### Main Claude Context Management
- **Reads**: User messages, agent summaries (2-3 sentences), coreInstructions.md
- **Does NOT read**: Code files, full agent outputs, implementation details
- **Updates directly**: activeContext.md "Current Work Focus" section only
- **Typical context per task**: ~500 tokens (vs ~5000 without orchestration)

### Agent Context Management
- **Reads**: activeContext.md (both sections), relevant code files, systemPatterns.md, docs/
- **Writes to memory**: Via memory-bank-keeper auto-calls
- **Returns**: Compressed summaries only
- **Can use full context**: Not limited like Main Claude

### Memory Bank Keeper Role
- **Central documentation hub** - All agents call this to document work
- **Updates**: activeContext.md "Recent Changes", progress.md when features complete
- **Never called directly by Main Claude** - Only called by other agents
- **Terminal node in chains** - Returns final summaries to Main Claude

---

## Example: Complete Implementation Flow

**User**: "Implement file upload for documents"

**Main Claude**:
1. Consults PRE-TASK CHECKLIST → "New feature" → context-researcher
2. Updates activeContext.md "Current Work Focus":
   ```markdown
   ### File Upload Implementation
   **Status**: Research phase
   **Agent**: context-researcher
   **User Request**: Add file upload to DocumentsService
   **Acceptance Criteria**:
   - Upload files via Files as Entity Properties pattern
   - Support PDF, images
   - User scoping automatic
   ```
3. Delegates to context-researcher: "Research file upload patterns in DocumentsService. Find Files as Entity Properties usage. Document current implementation."

**context-researcher**:
1. Reads DocumentsService.ts, FILE_STORAGE_SPEC.md, StorageAdapter.ts
2. Generates research report with variable names, function signatures, patterns
3. Auto-calls memory-bank-keeper with structured findings
4. **memory-bank-keeper** updates activeContext.md "Recent Changes"
5. Returns to Main Claude: "Found uploadFile() at DocumentsService.ts:342. Uses outdated storage.setFile() API. Should use storage.set(key, data, files) pattern from FILE_STORAGE_SPEC.md. Research documented in activeContext.md."

**Main Claude**:
1. Receives 3-sentence summary (no code, no full report)
2. Reports to user: "Research complete. Found existing upload method that needs update to Files as Entity Properties pattern. Ready to implement?"
3. User approves
4. Updates activeContext.md "Current Work Focus": Status = "Implementation phase"
5. Delegates to implementation: "Update DocumentsService.uploadFile() to use Files as Entity Properties pattern. See activeContext.md > Recent Changes for research findings."

**implementation**:
1. Reads activeContext.md "Recent Changes" (context-researcher findings there)
2. Reads suggested files (DocumentsService.ts, FILE_STORAGE_SPEC.md)
3. Modifies DocumentsService.uploadFile() at line 342
4. Auto-calls code-reviewer

**code-reviewer**:
1. Reviews modified code
2. Checks for bugs, reference errors, pattern compliance
3. Auto-calls test-runner-validator (if tests exist)
4. **test-runner-validator** runs tests, returns results
5. Auto-calls memory-bank-keeper with review findings
6. **memory-bank-keeper** updates activeContext.md "Recent Changes", updates progress.md
7. Returns to Main Claude: "✅ Implementation approved. Updated uploadFile() to Files as Entity Properties pattern. All tests pass. Ready to commit."

**Main Claude**:
1. Receives final summary (~30 tokens)
2. Reports to user: "File upload implemented and reviewed. No issues found. Tests pass. Ready to commit?"
3. User says "yes"
4. Delegates to git-workflow-manager

**Total Main Claude context used**: ~600 tokens
**Without orchestration**: ~6000+ tokens (reading code, agent outputs, etc.)

---

## Updating This File

**ONLY update coreInstructions.md when:**
- Adding a new agent to the system
- Adding a new workflow chain
- Modifying the PRE-TASK CHECKLIST (rare - requires careful consideration)
- Changing core orchestration rules
- Adding new agent types to decision tree

**NEVER update for:**
- Current work status (use activeContext.md)
- Recent changes (use activeContext.md)
- Progress tracking (use progress.md)
- New patterns discovered (use systemPatterns.md)
- Temporary workflow adjustments

This file is the **permanent foundation** of the agent orchestration system.
