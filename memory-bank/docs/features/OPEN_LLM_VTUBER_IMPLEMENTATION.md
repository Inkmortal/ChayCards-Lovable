# Open-LLM-VTuber Implementation Reference

## Overview
Open-LLM-VTuber is a Python backend + TypeScript/React frontend application that creates an interactive AI companion with Live2D avatar. This document details the exact implementation for future reference.

## Project Structure

### Backend (Python/FastAPI)
```
/Open-LLM-VTuber/
├── run_server.py                    # Entry point, starts FastAPI server
├── conf.yaml                        # Main configuration file
├── src/open_llm_vtuber/
│   ├── server.py                    # FastAPI setup, static mounts
│   ├── routes.py                    # WebSocket and API routes
│   ├── websocket_handler.py        # Core WebSocket message routing
│   ├── service_context.py          # Service container (ASR/TTS/Agent)
│   ├── message_handler.py          # Message processing logic
│   ├── live2d_model.py            # Live2D model config and emotions
│   ├── agent/                      # LLM agents and interfaces
│   ├── asr/                        # Speech recognition services
│   ├── tts/                        # Text-to-speech services
│   ├── conversations/              # Conversation flow handling
│   └── utils/                      # Audio streaming, etc.
```

### Frontend (Electron/React)
```
/Open-LLM-VTuber-Web/
├── src/
│   ├── main/                       # Electron main process
│   │   ├── index.ts               # IPC setup, window management
│   │   └── window-manager.ts      # Pet mode, transparency
│   └── renderer/                   # React app
│       ├── src/
│       │   ├── services/
│       │   │   └── websocket-service.tsx    # WebSocket client
│       │   ├── components/
│       │   │   └── canvas/
│       │   │       └── live2d.jsx          # Live2D rendering
│       │   ├── hooks/
│       │   │   ├── use-live2d-model.ts    # Live2D state management
│       │   │   └── use-audio-task.ts      # Audio playback queue
│       │   └── context/                    # React contexts
```

## Core Implementation Details

### 1. WebSocket Protocol

**Connection Flow:**
```python
# Backend: routes.py
@router.websocket("/client-ws")
async def websocket_endpoint(websocket: WebSocket):
    client_uid = str(uuid.uuid4())
    await websocket.accept()
    await handler.handle_new_connection(websocket, client_uid)
    # Message loop...
```

**Message Format:**
```typescript
interface WSMessage {
  type: 'audio' | 'control' | 'mic-audio-data' | 'text-input' | ...
  audio?: string        // Base64 WAV
  volumes?: number[]    // For lip-sync
  display_text?: {
    text: string
    name: string
    avatar?: string
  }
  actions?: {
    expressions?: number[]
  }
}
```

### 2. Audio Processing Pipeline

**Microphone → Backend:**
```typescript
// Frontend: use-speech.ts
audioWorklet.port.onmessage = (event) => {
  if (event.data.type === 'audio') {
    // Float32Array audio chunks
    websocket.send({
      type: 'mic-audio-data',
      audio: Array.from(event.data.audio)
    })
  }
}
```

**Backend Processing:**
```python
# websocket_handler.py
async def _handle_audio_data(self, websocket, client_uid, message):
    audio_array = np.array(message["audio"], dtype=np.float32)
    # Accumulate in buffer
    self.received_data_buffers[client_uid] = np.concatenate([
        self.received_data_buffers[client_uid], 
        audio_array
    ])
```

**TTS Generation:**
```python
# tts_manager.py
async def generate_tts_task(text: str, sequence: int):
    # Generate audio file
    audio_path = await tts_service.generate(text)
    # Convert to base64
    audio_data = load_and_encode_audio(audio_path)
    return TTSResult(audio_data, sequence)
```

### 3. Live2D Integration

**Model Configuration:**
```json
// live2d-models/model_dict.json
{
  "cat-black": {
    "url": "/live2d-models/cat-black/黒猫.model3.json",
    "kScale": 0.25,
    "initialX": 0,
    "initialY": -0.1,
    "expressions": {
      "joy": "01_Happy.exp3.json"
    }
  }
}
```

**Frontend Loading:**
```typescript
// use-live2d-model.ts
const model = await Live2DModel.from(modelInfo.url, {
  autoInteract: false,
  motionPreload: MotionPreloadStrategy.IDLE
})

// Expression mapping
model.expression(expressions[emotionIndex])

// Lip-sync
model.speak(audioElement, {
  volume: volumes,
  onFinish: () => { /* next audio */ }
})
```

### 4. Agent Response Processing

**Text Generation with Emotions:**
```python
# Agent outputs text with emotion tags
"Hello! [joy] How can I help you today? [neutral]"

# live2d_model.py extracts these
def extract_emotion(self, text: str) -> List[int]:
    pattern = r'\[(.*?)\]'
    emotions = re.findall(pattern, text)
    # Map to expression indices
    return [self.emotion_map[e] for e in emotions if e in self.emotion_map]
```

**Streaming Response:**
```python
# conversation_handler.py
async for sentence_output in agent.chat(input_data):
    # Extract display text and TTS text
    display_text = sentence_output.display_text
    tts_text = sentence_output.tts_text
    
    # Generate TTS
    tts_task = asyncio.create_task(
        tts_manager.generate_tts(tts_text, sequence)
    )
    
    # Stream to frontend
    await stream_sentence_audio(
        websocket,
        audio_data,
        display_text,
        expressions
    )
```

### 5. Pet Mode (Electron)

**Window Configuration:**
```typescript
// window-manager.ts
setPetMode() {
  this.window.setAlwaysOnTop(true, 'screen-saver')
  this.window.setVisibleOnAllWorkspaces(true)
  this.window.setIgnoreMouseEvents(true, { forward: true })
  
  // Transparent background
  this.window.setBackgroundColor('#00000000')
}

// Handle hover areas
updateComponentHover(componentId: string, isHovering: boolean) {
  if (this.mode === 'pet') {
    this.window.setIgnoreMouseEvents(!isHovering, { forward: true })
  }
}
```

## Key Implementation Patterns

### 1. Service Factory Pattern
```python
# Each service type has a factory
def ASRFactory(asr_config: ASRConfig) -> ASRInterface:
    if asr_config.asr_model == "FunASR":
        return FunASR(config)
    elif asr_config.asr_model == "Whisper":
        return WhisperASR(config)
    # ...
```

### 2. Async Streaming
```python
# All agent responses are async generators
async def chat(self, input: BaseInput) -> AsyncIterator[BaseOutput]:
    async for chunk in llm.generate_stream(prompt):
        yield process_chunk(chunk)
```

### 3. Message Queue Pattern
```typescript
// Audio tasks queued for sequential playback
const audioQueue = new TaskQueue()
audioQueue.push({
  audio: audioData,
  onStart: () => setExpression('joy'),
  onComplete: () => setExpression('neutral')
})
```

## Critical Files for Implementation

### Backend Core Files:
- `websocket_handler.py` - Message routing and client management
- `conversation_handler.py` - Conversation flow orchestration
- `single_conversation.py` - Input→Agent→TTS→Stream pipeline
- `stream_audio.py` - Audio chunking and volume calculation
- `live2d_model.py` - Model config and emotion extraction

### Frontend Core Files:
- `websocket-service.tsx` - WebSocket client and message handling
- `use-live2d-model.ts` - Live2D loading and control
- `use-audio-task.ts` - Audio playback queue management
- `use-speech.ts` - Microphone input and VAD
- `window-manager.ts` - Electron window modes

### Configuration Files:
- `conf.yaml` - Backend service configuration
- `model_dict.json` - Live2D model definitions
- `character_conf/` - Character prompts and settings

## Implementation Notes

1. **No Sandboxing** - Current implementation runs all code in main process
2. **No Tool Calling** - Agents are simple chat interfaces
3. **Single Backend** - One Python server handles everything
4. **File-based Audio** - TTS generates files, not streams
5. **Expression Timing** - Expressions set before audio playback
6. **Group Support** - Built-in multi-client conversation handling

This implementation provides a solid foundation for voice-interactive AI with Live2D avatars, focusing on real-time communication and smooth animation synchronization.