# CLAUDE.md
@memory-bank-instructions.md
@memory-bank/coreInstructions.md
@notion.md
@puppeteer.md

## Project: ChayCards

An all-in-one digital workspace combining document management, task tracking, and knowledge retention. Built with Electron, React, TypeScript, and TailwindCSS.

### Key Commands
- `npm run dev` - Start web dev server (WSL)
- `npm run dev:electron` - Start Electron with dev server (WSL)
- `npm run electron:win` - Run Electron from Windows (see dual env setup)
- `npm run lint` - Run ESLint
- `npm run build` - Build for production

### Development Environment

#### Dual Environment Setup (WSL + Windows)
This project uses a special dual-environment setup:
- **WSL**: Claude operates here, running the Vite dev server and handling all code changes
- **Windows**: Electron runs natively for proper UI rendering

**Why this setup?**
- Claude only runs in WSL but Electron UI looks bad when run through WSL
- Node modules compiled for Linux (WSL) won't work on Windows and vice versa
- This setup allows testing the web interface in WSL while running Electron natively on Windows

**Quick Start:**
1. From WSL: Run `npm run dev` (starts Vite on port 8080)
2. From Windows: Double-click `start-electron-windows.bat`
   - Auto-installs Windows dependencies on first run (~2 min)
   - Alternative: `npm run electron:win`

### Project Structure
- `/src` - React application source
- `/electron` - Electron main and preload scripts
- `/memory-bank` - Project documentation and context
- `/node_modules` - WSL/Linux dependencies
- `/node_modules_win` - Windows dependencies (git-ignored)

### Testing Approach
- Test web functionality at http://localhost:8080 in WSL
- Test Electron functionality using Windows executable
- Always verify changes work in both environments

### Platform Detection Standard

**CRITICAL**: Always use `src/utils/platform.ts` for platform detection. NEVER check `window.electronAPI` directly.

```typescript
// ✅ CORRECT - Use standardized utility
import { isElectron, isWeb, isCapacitor } from '@/utils/platform';

if (isElectron()) {
  // Access Electron API
  await window.electronAPI.storage.get(key);
}

// ❌ WRONG - Direct window.electronAPI check
if (window.electronAPI !== undefined) {  // DON'T DO THIS
  //...
}
```

**Available utilities**:
- `isElectron()` - Desktop Electron app (local SQLite storage)
- `isWeb()` - Browser (cloud PostgreSQL storage)
- `isCapacitor()` - Mobile iOS/Android
- `isMobile()` - Alias for isCapacitor()
- `isDesktop()` - Alias for isElectron()
- `getPlatform()` - Returns 'electron' | 'web' | 'capacitor'
- `platformCapabilities` - Feature detection (hasFileSystem, hasNativeFeatures, etc.)

See `src/utils/platform.ts:src/utils/platform.ts` for full JSDoc documentation.

### Git Commit Policy
**CRITICAL**: Never include Claude attribution in commit messages.
- NO "Generated with Claude Code" footer
- NO "Co-Authored-By: Claude" footer
- Keep commit messages clean and professional
- This applies to both regular Claude AND the git-workflow-manager agent

### Specialized Agents (Sub-agents)

## MANDATORY AGENT USAGE - NON-NEGOTIABLE RULES

**CRITICAL**: The following agent usage is **MANDATORY** and **NON-NEGOTIABLE**. Violating these rules means you are not following project standards. DO NOT ask for permission - these are requirements, not suggestions.

**IMPORTANT**: Agents auto-chain - Main Claude only starts the first agent, then waits for final summary.
- See `@memory-bank/coreInstructions.md` for complete agent workflow chains
- Main Claude delegates → First agent executes → Agents auto-call next agents → Final summary returns
- This prevents context bloat (600 tokens vs 5000+ without orchestration)

### ⛔ STOP AND USE AGENTS - Required Trigger Words

When you see these phrases in user requests, **STOP IMMEDIATELY** and use the specified agent:

**Implementation Triggers** → **MANDATORY: context-researcher FIRST**
- "implement", "add", "create", "build", "make", "write"
- "new feature", "new component", "new function", "new file"
- "refactor", "redesign", "restructure"

**Completion Triggers** → **MANDATORY: code-reviewer AFTER**
- "done", "finished", "completed", "implemented"
- "ready for review", "ready to commit"
- Any TODO marked as completed with >20 lines of code

**Error/Bug Triggers** → **MANDATORY: debug or root-cause-debugger**
- "error", "bug", "broken", "not working", "fails"
- "investigate", "why is", "what's wrong"
- Console errors, stack traces, unexpected behavior

**Commit Triggers** → **MANDATORY: precommit or git-workflow-manager**
- "commit", "ready to commit", "check in"
- "push", "PR", "pull request"
- User says task is complete

### 🚨 Mandatory Agent Workflows (Auto-Chaining)

**How auto-chaining works:**
1. Main Claude delegates to first agent
2. Agents auto-call next agents in chain (Main Claude NOT involved)
3. Final agent returns compressed summary (2-3 sentences) to Main Claude
4. Main Claude reports to user

See `@memory-bank/coreInstructions.md` for complete workflow details.

#### Workflow 1: Implementing New Features (AUTO-CHAINS)
```
Main Claude → context-researcher (auto-calls) → memory-bank-keeper → Returns summary
Main Claude gets user approval
Main Claude → implementation (auto-calls) → code-reviewer → test-runner-validator → memory-bank-keeper → Returns summary
```
**Never skip context-researcher**. Agents handle the rest automatically.

#### Workflow 2: Fixing Bugs (AUTO-CHAINS)
```
Main Claude → root-cause-debugger (auto-calls) → memory-bank-keeper → Returns summary
Main Claude gets user approval
Main Claude → implementation (auto-calls) → test-runner-validator → code-reviewer → memory-bank-keeper → Returns summary
```

#### Workflow 3: Committing Changes (AUTO-CHAINS)
```
Main Claude → security-reviewer (optional) → Returns summary
Main Claude → git-workflow-manager (auto-calls) → backlog-manager → memory-bank-keeper → Returns summary
```

#### Workflow 4: Refactoring (AUTO-CHAINS)
```
Main Claude → context-researcher (auto-calls) → memory-bank-keeper → Returns summary
Main Claude gets user approval
Main Claude → implementation (auto-calls) → code-cleanup-refactor → code-reviewer → memory-bank-keeper → Returns summary
```

### When to Use Agents (Detailed)

**Before Writing Code (MANDATORY)**:
- `context-researcher` - **REQUIRED** before implementing ANY new feature/component/function
- `planner` - **REQUIRED** for complex features requiring step-by-step planning (>3 files, >100 lines)
- `analyze` - **REQUIRED** when evaluating architecture or code structure

**During Implementation (Use When Appropriate)**:
- `general-purpose` - Use for multi-step research or code searches
- `debug` - **REQUIRED** when encountering errors or investigating issues
- `tracer` - Use to understand execution flow or dependencies
- `root-cause-debugger` - **REQUIRED** for mysterious bugs or multi-step investigations

**After Writing Code (MANDATORY)**:
- `code-reviewer` - **REQUIRED** after implementing significant functionality (>20 lines of new code)
- `test-runner-validator` - **REQUIRED** after implementation to verify tests pass
- `unit-test-generator` - Use to create comprehensive test coverage
- `frontend-qa-tester` - **REQUIRED** after UI implementation to verify functionality
- `code-cleanup-refactor` - **REQUIRED** after refactoring to find unused code

**Before Committing (MANDATORY)**:
- `precommit` - **REQUIRED** to validate changes before git commits
- `security-reviewer` - **REQUIRED** when changes involve auth, data handling, or APIs
- `secaudit` - Use for comprehensive security review (OWASP, compliance)

**Project Management (Use Frequently)**:
- `git-workflow-manager` - **REQUIRED** for commits, branches, and git operations
- `backlog-manager` - **REQUIRED** when tasks are completed or new tasks identified
- `memory-bank-keeper` - **REQUIRED** after significant changes to update documentation

#### Available Agents

##### Development & Code Quality
- `general-purpose` - Multi-step research, code search, and complex tasks
- `context-researcher` - Gather codebase context BEFORE implementing features
- `code-reviewer` - Review code AFTER implementation with quality checks
- `code-cleanup-refactor` - Clean up unused code and artifacts after refactoring
- `unit-test-generator` - Generate comprehensive test coverage
- `test-runner-validator` - Execute and validate unit tests

##### Project Management
- `git-workflow-manager` - Manage git operations, commits, and branches
- `backlog-manager` - Track and manage project tasks and backlog
- `memory-bank-keeper` - Update Memory Bank documentation after changes

##### Security & Testing
- `security-reviewer` - Review security vulnerabilities and authentication
- `frontend-qa-tester` - Verify frontend implementations and user interactions

##### Zen MCP Advanced Tools
- `chat` - Collaborative thinking and brainstorming partner
- `thinkdeep` - Multi-stage investigation for complex problems
- `planner` - Interactive sequential planning with branching
- `consensus` - Multi-model debate for architectural decisions
- `codereview` - Systematic code review with expert validation
- `precommit` - Validate git changes before committing
- `debug` - Root cause analysis and systematic debugging
- `secaudit` - Comprehensive security auditing (OWASP, compliance)
- `docgen` - Generate code documentation with complexity analysis
- `analyze` - Comprehensive code analysis (architecture, performance)
- `refactor` - Analyze refactoring opportunities and code smells
- `tracer` - Trace code execution flow or dependencies
- `testgen` - Generate comprehensive test suites
- `challenge` - Force critical thinking to prevent reflexive agreement

##### Integration Tools
- **Notion MCP** - Track tasks in ChayCards_Dev database across sessions
  - **CRITICAL**: When human mentions status terms (e.g., "in progress", "backlog", "done"), these refer to the **literal Notion Status property values**
  - Always filter queries by Status property when these terms are mentioned
  - See notion.md for complete Status filtering guide
- **Puppeteer MCP** - Automated browser testing and UI verification

#### Agent Best Practices

1. **Be Proactive**: Don't wait for user to ask - invoke agents when their expertise matches the task
2. **Use Before Implementation**: Context research prevents reinventing existing patterns
3. **Use After Implementation**: Code review and testing ensure quality
4. **Chain Agents**: Use multiple agents in sequence (research → implement → review → test)
5. **Parallel Execution**: Run independent agents in parallel when possible (e.g., multiple file searches)
- I will restart vite, you should never restart vite. always use frontend qa agent when testing frontend