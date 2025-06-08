# Plugin Python Backend Support

## Overview

Plugins can include Python backends for compute-intensive tasks like AI/ML, data processing, or integrating Python-only libraries. Python processes are managed as plugin services and bundled with the Electron app.

## Architecture

Python backends run as child processes managed by plugin services:

```
Plugin TypeScript Service → Spawns Python Process → Communicates via WebSocket/IPC
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
  
  services: {
    'pythonService': new PythonService()
  },
  
  onLoad: async (manager) => {
    const service = manager.getService('my-ai-plugin/pythonService');
    await service.start();  // Start Python process
  },
  
  onUnload: async () => {
    const service = manager.getService('my-ai-plugin/pythonService');
    await service.stop();   // Clean shutdown
  }
}
```

### 2. Python Service Manager

```typescript
// services/PythonService.ts
import { spawn, ChildProcess } from 'child_process';
import WebSocket from 'ws';

export class PythonService {
  private process?: ChildProcess;
  private ws?: WebSocket;
  private port?: number;
  
  async start() {
    // Allocate port
    this.port = await findAvailablePort(40000, 50000);
    
    // Get Python executable path
    const pythonPath = this.getPythonPath();
    const scriptPath = path.join(__dirname, '../backend/main.py');
    
    // Spawn Python process
    this.process = spawn(pythonPath, [scriptPath, '--port', this.port], {
      cwd: path.join(__dirname, '../backend'),
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1'  // Important for real-time output
      }
    });
    
    // Wait for Python to be ready
    await this.waitForReady();
    
    // Connect WebSocket
    this.ws = new WebSocket(`ws://localhost:${this.port}`);
  }
  
  private getPythonPath(): string {
    if (window.electron) {
      // Use bundled Python in production
      return path.join(process.resourcesPath, 'python/python');
    }
    // Development: use system Python
    return 'python3';
  }
  
  async stop() {
    this.ws?.close();
    this.process?.kill('SIGTERM');
  }
  
  // Service methods
  async processData(data: any): Promise<any> {
    return this.sendCommand('process', data);
  }
}
```

### 3. Python Backend Template

```python
# backend/main.py
import asyncio
import json
import argparse
from fastapi import FastAPI, WebSocket
import uvicorn

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            command = data.get('command')
            
            if command == 'process':
                result = await process_data(data['payload'])
                await websocket.send_json({
                    'id': data.get('id'),
                    'result': result
                })
    except Exception as e:
        print(f"Error: {e}")

async def process_data(data):
    # Your Python logic here
    return {"processed": data}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    
    uvicorn.run(app, host="127.0.0.1", port=args.port)
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
- Each plugin spawns its own Python process
- Communicates via localhost WebSocket/HTTP
- Process lifecycle tied to plugin lifecycle

### Cloud (Web)
- Express backend spawns Python processes
- Can use connection pooling for efficiency
- Same Python code, different process management
- May add request queuing for scale

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
    manager.on('app:closing', () => service.stop());
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