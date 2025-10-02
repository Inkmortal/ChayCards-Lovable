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

### Available Agents

Claude has access to specialized agents through the Task tool for different workflows:

#### Development & Code Quality
- `general-purpose` - Multi-step research, code search, and complex tasks
- `context-researcher` - Gather codebase context before implementing features
- `code-reviewer` - Review code after implementation with quality checks
- `code-cleanup-refactor` - Clean up unused code and artifacts after refactoring
- `unit-test-generator` - Generate comprehensive test coverage
- `test-runner-validator` - Execute and validate unit tests

#### Project Management
- `git-workflow-manager` - Manage git operations, commits, and branches
- `backlog-manager` - Track and manage project tasks and backlog
- `memory-bank-keeper` - Update Memory Bank documentation after changes

#### Security & Testing
- `security-reviewer` - Review security vulnerabilities and authentication
- `frontend-qa-tester` - Verify frontend implementations and user interactions

#### Zen MCP Advanced Tools
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

#### Integration Tools
- **Notion MCP** - Track tasks in ChayCards_Dev database across sessions
- **Puppeteer MCP** - Automated browser testing and UI verification
