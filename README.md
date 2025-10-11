# ChayCards

**Your all-in-one digital workspace that grows with you** 🚀

ChayCards is your central hub for digital work - combining document management, task tracking, and knowledge retention into one seamless platform. But here's what makes it different: **everything is a plugin**. Just like your favorite games let you install mods without changing the core game, ChayCards lets you customize every aspect of your workspace.

Want AI-powered flashcards? There's a plugin for that. Need a gamified productivity system? Build it as a plugin. Custom task views? Plugin. The possibilities are endless, and the foundation is already here.

## 🌟 The Vision

Imagine a workspace that truly adapts to *your* way of working:

- **For Students**: Course materials that automatically generate study guides, flashcards that use spaced repetition, and a task system that helps you stay on track
- **For Professionals**: Project documentation that links to tasks, meeting notes that extract action items, and knowledge bases that grow with your expertise
- **For Researchers**: Literature reviews that organize themselves, research notes with semantic linking, and experiment tracking that makes sense

ChayCards makes this possible through a powerful plugin architecture where the community builds the features *they* need, and everyone benefits.

## 🎯 What's Working Right Now

We've built the foundation for something special - a plugin system so powerful that even core features like themes and settings are just plugins:

### 🏗️ The Foundation (Ready to Build On!)

**Works Everywhere**
- Run as a native desktop app (Electron) with local SQLite storage
- Run in your browser with cloud PostgreSQL storage
- Same code, same features, your choice of platform

**The Plugin Magic** ✨
- **Automatic Discovery**: Drop a plugin folder in, it just works
- **Smart Dependencies**: Plugins can build on each other
- **Live Updates**: Change code, see results instantly (hot reload)
- **Pick What You Want**: Enable only the plugins you need

### 🎨 Already Installed

**Beautiful Themes**
- 7 gorgeous themes ready to go: Catppuccin, Dracula, Tokyo Night, Gruvbox, Nord, Rose Pine, and our custom Chay theme
- Switch themes with a click - settings persist across sessions

**Developer-Friendly UI Kit**
- 32 polished components (buttons, cards, forms, modals, etc.)
- Plugin developers can use them or build their own

**Your Settings, Your Way**
- Choose local or cloud storage
- Customize your profile
- Database admin tools included

**Coming to Life: Documents**
- File management service ready (upload, organize, search)
- UI components coming soon

## 🚀 What's Coming Next

The infrastructure is ready - now comes the exciting part! Here's what we're building:

### 📝 Documents Plugin (In Progress!)
The service layer is complete - now we're building the UI:
- **Visual file browser** with grid and list views
- **Rich markdown editor** for notes and documents
- **Smart organization** with folders and tags
- **Drag-and-drop** file management

### 📚 Knowledge Management (Ready to Build!)
Turn your notes into lasting knowledge:
- **Auto-generate flashcards** from your documents
- **Spaced repetition** that actually works
- **AI-powered insights** from your knowledge base
- **Smart review scheduling** based on how well you remember

### ✅ Task Management (Ready to Build!)
Track what matters without the overhead:
- **Simple, powerful task creation**
- **Project organization** that makes sense
- **Priority management** that helps you focus
- **Game integration** - turn productivity into playtime!

### 🎮 Gamification (The Fun Part!)
Productivity meets gaming:
- **Earn game time** by completing tasks
- **Level up** your character through real work
- **Godot integration** for actual gameplay
- **Reward system** that keeps you motivated

### 🤖 AI Assistant (Dream Big!)
Your personalized workspace companion:
- **Live2D character** that interacts with you
- **Voice commands** for hands-free work
- **Smart suggestions** based on your patterns
- **Python ML backend** for advanced features

## 🧩 Plugin Architecture

ChayCards is built entirely around plugins. Even core features like themes and settings are implemented as plugins, demonstrating the system's flexibility:

**What makes a plugin?**
- Manifest file with metadata and dependencies
- Components that can be rendered in regions (header, sidebar, main, footer)
- Services that manage business logic and storage
- Routes that appear in automatic navigation
- Lifecycle hooks (onLoad, onPluginsReady)
- Optional Python backends for advanced features

**Plugin Examples in Production:**
- `core-theme`: Manages theme system with 7 variants
- `core-ui`: Provides 32 shared components
- `core-settings`: Handles storage mode and user profile
- `core-documents`: File management service layer (UI in progress)
- `demo-plugin`: Demonstrates storage patterns and admin tools

**Creating Plugins:**
See `/src/plugins/CLAUDE.md` for detailed plugin development guide with examples and best practices.

## 🚀 Let's Get Started!

Ready to try ChayCards? Here's how to get up and running in minutes.

### What You'll Need

- [Node.js](https://nodejs.org/) v18+ (the JavaScript runtime)
- [Git](https://git-scm.com/downloads) (to clone the code)
- For desktop app on Windows: WSL2 with Ubuntu

### Easiest Way: Browser Version

Perfect for trying ChayCards without installing anything extra:

```bash
# Grab the code
git clone https://github.com/yourusername/chaycards.git
cd chaycards

# Install dependencies (takes ~2 minutes)
npm install

# Start it up!
npm run dev
```

Then open your browser to `http://localhost:8080` and you're in! 🎉

### Desktop App (Windows + WSL)

Want the full desktop experience? ChayCards uses a smart dual-environment setup:

**In WSL (where your code lives):**
```bash
git clone https://github.com/yourusername/chaycards.git
cd chaycards
npm install
npm run dev    # Starts the development server
```

**In Windows (for the pretty UI):**
- Double-click `start-electron-windows.bat`
- Or run: `npm run electron:win`

**Why two environments?** WSL gives us hot-reload development magic, while Windows native rendering makes the UI beautiful. Best of both worlds!

### Your First Experience

When you launch ChayCards, here's what happens:

1. **Pick Your Storage**: Local (SQLite on your computer) or Cloud (PostgreSQL online)
2. **Auto-Login**: Jump straight in as a demo user
3. **Explore**: Try the demo plugin, switch themes, poke around settings

**Cool Things to Try:**
- Switch between 7 beautiful themes (theme selector in header)
- Check out the demo plugin to see storage in action
- Peek at settings to see database admin tools
- Browse the sidebar to see plugin navigation

### Making It Yours

Want to build something? The development experience is smooth:

```bash
# Start the dev server (browser)
npm run dev

# Or run the desktop app (Windows)
npm run electron:win
```

**Hot Reload Magic**: Change code, save, and watch your changes appear instantly. No rebuild, no restart (most of the time).

### Server Management (Windows Users)

Want to test the full app with Notion sync? Use our automated server launcher:

**Quick Start All Servers (Recommended - tmux layout):**
- Double-click `start-servers-tmux.bat` (see all logs in split panes, Ctrl+C to stop)
- Or: `start-servers-tmux-tunnel.bat` (adds Cloudflare Tunnel in 4th pane)

**Alternative (background tabs):**
- Double-click `start-servers.bat` (PostgreSQL + Notion PM Server in separate tabs)
- Or: `start-servers-with-tunnel.bat` (adds Cloudflare Tunnel)

**Stop All Servers:**
- Double-click `stop-servers.bat`

**What You Get:**
- PostgreSQL database on port 5433
- Notion PM sync server on port 3001
- Cloudflare tunnel at https://dev.chaycards.com (if using tunnel variant)
- All services run in WSL with live logs in Windows Terminal tabs

**See:** `SERVER-SCRIPTS.md` for full documentation and troubleshooting.

### When Things Go Wrong

**"Port already in use" error:**
```bash
lsof -i :8080    # Find what's using port 8080
# Then kill it or use a different port
```

**Electron shows blank screen:**
- Make sure `npm run dev` is running first
- Hit F12 to see if there are errors
- Try refreshing (Ctrl+R)

**Need to start fresh?**
- Settings page → "Clear Database" button
- Or delete storage files:
  - Desktop: `%APPDATA%/ChayCards/storage.db`
  - Web: Contact us for cloud reset

**Still stuck?** Open a GitHub issue - we're here to help!

## 📚 Documentation

**For Users:**
- Setup guide and troubleshooting (this README)
- Theme system and customization (coming soon)

**For Developers:**
- `/CLAUDE.md` - Main project instructions for AI assistance
- `/src/plugins/CLAUDE.md` - Plugin development guide with examples
- `/memory-bank/` - Project documentation and technical context
  - `systemPatterns.md` - Architecture and design decisions
  - `techContext.md` - Technologies and development setup
  - `progress.md` - Current status and completed features
  - `docs/` - Detailed specifications (File Storage, Documents, etc.)

**For AI Assistants (Claude Code):**
- `/memory-bank-instructions.md` - How to use the memory bank
- `/memory-bank/coreInstructions.md` - Agent orchestration rules
- `/notion.md` - Notion MCP integration guide
- `/puppeteer.md` - Puppeteer testing guide

## 🛠️ Built With

**Frontend:**
- React 18 with TypeScript
- React Router v6 for navigation
- TailwindCSS for styling
- Vite for build tooling

**Backend:**
- Electron for desktop (main + preload + renderer)
- Express.js API server (cloud storage)
- Better-sqlite3 (local storage)
- PostgreSQL (cloud storage via Cloudflare Tunnel)

**Development Tools:**
- Claude Code for AI-assisted development
- Notion MCP for persistent task tracking
- Puppeteer MCP for automated frontend testing
- ESLint + TypeScript strict mode

## 🤝 Join the Journey

ChayCards is just getting started, and we'd love your help building something amazing!

**Ways to Contribute:**

🎨 **Build Cool Plugins**
- Dream up a task manager that works *your* way
- Create a study tool that actually helps you learn
- Design a calendar integration that makes sense
- Build whatever *you* wish existed!

💻 **Improve What's Here**
- Polish the UI components
- Add themes (we can never have too many!)
- Write tutorials and examples
- Find and fix bugs

📚 **Share Knowledge**
- Document your plugin-building journey
- Create video tutorials
- Write blog posts about your experience
- Help others in discussions

**Getting Started:**
1. Browse `/src/plugins/` to see how plugins work
2. Read `/src/plugins/CLAUDE.md` for the plugin guide
3. Check existing issues or create new ones
4. Start building! The foundation is ready

## 📄 License

MIT License - build anything, share everything!

## 🎯 Where We're At

**October 2025 - The Foundation is Ready** 🎉

We've built something special: a plugin system so flexible that even themes and settings are just plugins. The hard infrastructure work is done - now comes the fun part where we build the features that make ChayCards amazing.

**What's Next:**
- Finishing the documents plugin UI
- Building the task and knowledge plugins
- Creating the gamification system
- Making your workspace truly yours

**The Vision:**
ChayCards isn't trying to be another productivity app. It's a platform where YOU decide what productivity means. Build the tools you need, share them with others, and create a workspace that actually works the way you think.

---

**Ready to build the future of digital workspaces?** Clone the repo and let's make something cool together! 🚀
