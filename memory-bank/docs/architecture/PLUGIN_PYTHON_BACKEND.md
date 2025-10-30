# Plugin Python Backend Support

## Overview

Plugins can include Python backends for compute-intensive tasks like AI/ML, data processing, or integrating Python-only libraries. The unified backend adapter pattern ensures plugin code remains identical for both local and cloud deployments.

## Architecture

All Python backend communication goes through the Express API:

```
Plugin Service → Backend Adapter → Express API → Python Service
                                        ↓
                              Local: Reverse Proxy → Python Process
                              Cloud: API Gateway → Python Container
```

## Plugin Structure with Python

```
plugins/
└── my-ai-plugin/
    ├── index.ts                    # Plugin definition
    ├── package.json                # JS dependencies
    ├── frontend/                   # React components
    │   └── components/
    ├── services/                   # TS services that manage Python
    │   └── MyPythonService.ts
    ├── backend/                    # Python code
    │   ├── main.py                 # Entry point
    │   ├── requirements.txt        # Python dependencies
    │   └── .venv/                  # Virtual environment (dev only)
    └── build/                      # Build scripts
        └── setup-python.js         # Install Python deps during build
```

## Implementation Pattern

### 1. Plugin Definition

```typescript
// index.ts
export const MyAIPlugin: Plugin = {
  id: 'my-ai-plugin',
  name: 'My AI Plugin',
  
  // Declare Python backend
  backend: {
    python: {
      entry: 'backend/main.py',
      requirements: 'backend/requirements.txt'
    }
  },
  
  services: {
    ai: class AIService {
      constructor(private adapters: PluginAdapters) {}
      
      async processQuery(text: string) {
        // Use backend adapter - same code for local and cloud!
        return await this.adapters.backend.request('my-ai-plugin', {
          action: 'process',
          text: text
        });
      }
    }
  }
}
```

### 2. Using Backend and Storage Adapters

```typescript
// services/AIService.ts
export class AIService {
  constructor(private adapters: PluginAdapters) {}
  
  async processUserQuery(query: string): Promise<Response> {
    // Storage adapter handles user context automatically
    // Local: SQLite with single user
    // Cloud: PostgreSQL with user from auth
    const preferences = await this.adapters.storage.get('preferences');
    const history = await this.adapters.storage.get('history');
    
    // Backend adapter handles routing
    // Local: http://localhost:3000/api/python/ai-assistant
    // Cloud: https://api.chaycards.com/python/ai-assistant
    const response = await this.adapters.backend.request('ai-assistant', {
      action: 'process',
      query: query,
      context: {
        preferences,
        recentHistory: history.slice(-10)
      }
    });
    
    // Save to user's storage namespace
    await this.adapters.storage.append('history', {
      query,
      response: response.text,
      timestamp: Date.now()
    });
    
    return response;
  }
}
```

### 3. Python Backend Template

```python
# backend/main.py
from fastapi import FastAPI
import uvicorn
import argparse

app = FastAPI()

@app.post("/process")
async def process_request(request: dict):
    """Handle requests from the backend adapter"""
    action = request.get('action')
    
    if action == 'process':
        # Your AI/ML logic here
        query = request.get('query')
        context = request.get('context', {})
        
        result = await process_query(query, context)
        return {"text": result, "success": True}
    
    return {"error": "Unknown action", "success": False}

async def process_query(query: str, context: dict):
    # Your Python logic here
    # Access preferences: context.get('preferences')
    # Access history: context.get('recentHistory', [])
    return f"Processed: {query}"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5000)
    args = parser.parse_args()
    
    # Local: Runs on assigned port
    # Cloud: Runs in container on port 5000
    uvicorn.run(app, host="0.0.0.0", port=args.port)
```

## Build Process

### Development Setup

```bash
# In plugin's backend directory
cd plugins/my-ai-plugin/backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Build Script

```javascript
// build/setup-python.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

async function setupPython() {
  const backendDir = path.join(__dirname, '../backend');
  
  // For production build: install deps to a clean directory
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(__dirname, '../dist/backend');
    
    // Copy Python files
    await fs.copy(backendDir, distDir, {
      filter: (src) => !src.includes('.venv') && !src.includes('__pycache__')
    });
    
    // Install dependencies
    execSync(`pip install -r requirements.txt --target ${distDir}/vendor`, {
      cwd: distDir
    });
  }
}

setupPython().catch(console.error);
```

## Platform Differences

### Electron (Local)
- Python bundled with app in `resources/python/`
- Shared Python service for all users (single-user local deployment)
- Communicates via localhost WebSocket/HTTP
- Process lifecycle managed by app, not individual plugins

### Cloud (Web)
- Express backend manages shared Python services
- Multi-tenant: user context passed with each request
- Same Python code, user isolation through middleware
- Horizontal scaling by adding more service instances

## Best Practices

### 1. Process Management
- Always implement graceful shutdown in `onUnload`
- Monitor Python process health
- Implement automatic restart on crash
- Use process pools for heavy workloads

### 2. Communication
- Use WebSocket for streaming/real-time
- Use HTTP for request/response
- Always include request IDs for async operations
- Implement timeout handling

### 3. Dependencies
- Use virtual environments in development
- Bundle only necessary dependencies
- Consider using lightweight alternatives (e.g., FastAPI over Django)
- Document system dependencies (e.g., CUDA for AI)

### 4. Security
- Never expose Python ports externally
- Validate all inputs from frontend
- Use subprocess with shell=False
- Sanitize file paths and system commands

### 5. Resource Management
- Set memory limits for Python processes
- Implement request queuing
- Monitor CPU usage
- Clean up temporary files

## Example: AI Assistant Plugin

```typescript
// Full example showing Python integration
export const AIAssistantPlugin: Plugin = {
  id: 'ai-assistant',
  
  services: {
    'assistantService': new AssistantService()
  },
  
  components: {
    'AssistantChat': lazy(() => import('./frontend/AssistantChat'))
  },
  
  routes: [{
    path: '/ai-assistant',
    component: 'ai-assistant/AssistantChat',
    label: 'AI Assistant',
    icon: 'Bot'
  }],
  
  onLoad: async (manager) => {
    const service = manager.getService('ai-assistant/assistantService');
    
    // Start Python backend
    await service.start();
    
    // Register event handlers
    const eventBus = manager.getEventBus();
    eventBus.on('app:closing', () => service.stop());
  }
}
```

## Docker Support (Optional)

For plugins requiring complex environments:

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

The plugin service can optionally use Docker instead of direct Python:

```typescript
if (this.config.useDocker) {
  this.container = await docker.run('my-plugin:latest', {
    ports: { '8000/tcp': this.port }
  });
} else {
  this.process = spawn(pythonPath, [scriptPath]);
}
```

## Troubleshooting

### Common Issues

1. **Python not found**: Ensure Python is bundled correctly in Electron build
2. **Module import errors**: Check PYTHONPATH and dependency installation
3. **Port conflicts**: Implement proper port allocation with retry logic
4. **Process zombies**: Always clean up child processes on exit

### Debug Tips

```typescript
// Log Python output for debugging
this.process.stdout.on('data', (data) => {
  console.log(`Python: ${data}`);
});

this.process.stderr.on('data', (data) => {
  console.error(`Python Error: ${data}`);
});
```

## Conclusion

Python backends are first-class citizens in the plugin system, managed as services with proper lifecycle management. This approach maintains plugin independence while enabling powerful Python-based features.