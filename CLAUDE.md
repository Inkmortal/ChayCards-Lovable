# CLAUDE.md
@memory-bank-instructions.md
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

**IMPORTANT**: Claude should **proactively invoke** specialized agents when tasks match their expertise. Agents have separate context windows, specialized prompts, and focused toolsets that make them superior for specific workflows. Don't ask permission - just use them when appropriate.

#### When to Use Agents

**Before Writing Code**:
- `context-researcher` - ALWAYS use before implementing new features to understand existing patterns
- `planner` - Use for complex features requiring step-by-step planning
- `analyze` - Use when evaluating architecture or code structure

**During Implementation**:
- `general-purpose` - Use for multi-step research or code searches
- `debug` - Use when encountering errors or investigating issues
- `tracer` - Use to understand execution flow or dependencies

**After Writing Code**:
- `code-reviewer` - ALWAYS use after implementing significant functionality
- `test-runner-validator` - Use to execute and validate tests
- `unit-test-generator` - Use to create comprehensive test coverage
- `frontend-qa-tester` - Use to verify UI implementations
- `code-cleanup-refactor` - Use after refactoring to find unused code

**Before Committing**:
- `precommit` - Use to validate changes before git commits
- `security-reviewer` - Use when changes involve auth, data handling, or APIs
- `secaudit` - Use for comprehensive security review

**Project Management**:
- `git-workflow-manager` - Use for commits, branches, and git operations
- `backlog-manager` - Use when tasks are completed or new tasks identified
- `memory-bank-keeper` - Use after significant changes to update documentation

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
