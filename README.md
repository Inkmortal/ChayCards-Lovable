
# Cross-Platform Task Manager

A modern task management application built with React that runs both as a web application and as an Electron desktop app, sharing the same codebase and backend interfaces.

## 🏗️ Architecture Overview

This application demonstrates a clean separation of concerns with shared business logic:

- **Shared Core**: React components, hooks, and business logic
- **Platform Adapters**: Abstraction layer for platform-specific functionality
- **Backend Services**: Unified API layer that works across both platforms
- **Modern UI**: Responsive design with smooth animations using shadcn/ui

## 🚀 Features

- ✅ Cross-platform compatibility (Web + Desktop)
- 📱 Responsive design
- 🎯 Task management with priorities
- 💾 Import/Export functionality
- 🔔 Native notifications
- 🎨 Modern, clean interface
- ⚡ Fast and efficient

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query
- **Desktop**: Electron
- **Build Tools**: Vite, Electron Builder

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Git

### Clone and Install

```bash
git clone <your-repo-url>
cd cross-platform-task-manager
npm install
```

## 🌐 Running as Web App

```bash
# Development
npm run dev

# Build for production
npm run build
npm run preview
```

The web app will be available at `http://localhost:8080`

## 🖥️ Running as Electron Desktop App

### Development Mode

```bash
# Start the web dev server and Electron together
npm run electron:dev
```

### Build Desktop App

```bash
# Build the web app first
npm run build

# Build Electron app for your platform
npm run electron:build

# Build for specific platforms
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

Built apps will be in the `dist-electron` directory.

## 📋 Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron electron/main.js\"",
    "electron:build": "electron-builder",
    "electron:build:mac": "electron-builder --mac",
    "electron:build:win": "electron-builder --win",
    "electron:build:linux": "electron-builder --linux"
  }
}
```

## 🏗️ Platform Abstraction

The application uses a platform adapter pattern to handle differences between web and desktop:

### Web Platform Features
- Browser notifications (with permission)
- File download/upload via HTML5 APIs
- External links open in new tabs

### Desktop Platform Features  
- Native system notifications
- Native file dialogs for save/open
- External links open in default browser
- Better file system access

### Shared Interface

```typescript
interface PlatformAdapter {
  getConfig(): AppConfig;
  showNotification(title: string, body: string): void;
  openExternal(url: string): void;
  saveFile(data: string, filename: string): Promise<void>;
  readFile(): Promise<string | null>;
}
```

## 🔧 Development

### Project Structure

```
src/
├── adapters/          # Platform-specific implementations
├── components/        # Shared React components  
├── hooks/            # Custom React hooks
├── services/         # Business logic and API layer
├── types/            # TypeScript interfaces
└── pages/            # Application pages

electron/
├── main.js           # Electron main process
└── preload.js        # Secure IPC bridge
```

### Adding New Features

1. **Platform-agnostic features**: Add to shared components and services
2. **Platform-specific features**: Extend the platform adapters
3. **New pages**: Add to both routing and navigation

### Environment Variables

Create `.env` files for different environments:

```bash
# .env.development
REACT_APP_API_URL=http://localhost:3001

# .env.production  
REACT_APP_API_URL=https://your-api.com
```

## 📱 Mobile Support

While this focuses on web and desktop, the responsive design works well on mobile browsers. For native mobile apps, consider extending the platform adapter pattern with Capacitor.

## 🔒 Security

The Electron app follows security best practices:
- Context isolation enabled
- Node integration disabled  
- Secure IPC communication via preload script
- External content restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and desktop
5. Submit a pull request

## 📄 License

MIT License - feel free to use this architecture for your own projects!

## 🆘 Troubleshooting

### Common Issues

**Electron app won't start in development:**
- Ensure the web dev server is running first
- Check that port 8080 is available

**Build failures:**
- Clear `node_modules` and reinstall
- Ensure all dependencies are compatible

**Platform adapter not working:**
- Check that the correct adapter is being instantiated
- Verify IPC handlers are registered in main.js

### Getting Help

- Check the console for error messages
- Ensure all dependencies are installed correctly
- Test the web version first to isolate issues

## 🚀 Deployment

### Web App
Deploy the built web app to any static hosting service (Vercel, Netlify, etc.)

### Desktop App
Distribute the built Electron apps via:
- Direct download from your website
- App stores (Mac App Store, Microsoft Store)
- Package managers (Homebrew, Chocolatey)

---

This architecture provides a solid foundation for building cross-platform applications that share code while leveraging platform-specific capabilities where needed.
