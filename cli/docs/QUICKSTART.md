# CCHighway Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Claude Code installed and accessible in PATH
- Port 3000 available

## Installation & Setup

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Start the server**:
   ```bash
   node dist/cli/index.js start --port 3000
   ```

   You should see:
   ```
   ✓ CCHighway server running on port 3000
     Working directory: /path/to/current/directory
     API URL: http://localhost:3000/api
     WebSocket URL: ws://localhost:3000
   ```

## Basic API Testing

### 1. Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{"status":"ok","timestamp":"2025-06-11T03:56:15.291Z"}
```

### 2. List Sessions

```bash
curl http://localhost:3000/api/sessions
```

**Expected Response**:
```json
{"sessions":[]}
```

### 3. Create a New Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"workDir": "/tmp"}'
```

**Expected Response**:
```json
{
  "session": {
    "id": "uuid-here",
    "workDir": "/tmp",
    "status": "idle",
    "createdAt": "2025-06-11T03:56:15.291Z",
    "updatedAt": "2025-06-11T03:56:15.291Z",
    "turnCount": 0
  }
}
```

### 4. Execute a Simple Prompt

```bash
# Replace {session-id} with the actual UUID from step 3
curl -X POST http://localhost:3000/api/sessions/{session-id}/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello! What is 2 + 2?"}'
```

**Expected Response**:
```json
{
  "sessionId": "uuid-here",
  "processId": "uuid-here", 
  "status": "running"
}
```

### 5. Quick Execute (Auto-creates Session)

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the current date and time?"}'
```

### 6. Get Session History

```bash
# Wait a moment for execution to complete, then:
curl http://localhost:3000/api/sessions/{session-id}/history
```

**Expected Response**:
```json
{
  "sessionId": "uuid-here",
  "history": [
    {
      "type": "user",
      "message": {
        "role": "user",
        "content": "Hello! What is 2 + 2?"
      },
      "session_id": "uuid-here"
    },
    {
      "type": "assistant", 
      "message": {
        "role": "assistant",
        "content": "Hello! 2 + 2 equals 4."
      },
      "session_id": "uuid-here"
    }
  ]
}
```

### 7. Server Status

```bash
curl http://localhost:3000/api/status
```

## Command Line Interface

### Available Commands

```bash
# Start server
node dist/cli/index.js start [options]

# Stop server  
node dist/cli/index.js stop

# Check status
node dist/cli/index.js status

# Show help
node dist/cli/index.js --help
```

### Start Options

```bash
node dist/cli/index.js start \
  --port 3000 \
  --dir /my/work/directory \
  --daemon
```

## Troubleshooting

### Server Won't Start

1. **Claude Code not found**:
   ```
   Error: Claude Code executable not found
   ```
   
   **Solution**: Ensure Claude Code is installed:
   ```bash
   which claude
   # Should return: /path/to/claude
   ```

2. **Port already in use**:
   ```
   Error: listen EADDRINUSE :::3000
   ```
   
   **Solution**: Use a different port:
   ```bash
   node dist/cli/index.js start --port 3001
   ```

### API Requests Fail

1. **Connection refused**:
   ```bash
   curl: (7) Failed to connect to localhost port 3000
   ```
   
   **Solution**: Verify server is running:
   ```bash
   node dist/cli/index.js status
   ```

2. **404 Not Found**:
   - Check endpoint spelling
   - Use `/health` not `/api/health` for health check
   - API endpoints are under `/api/` prefix

### Execution Issues

1. **Session not found (404)**:
   - Verify session ID is correct
   - Check session still exists: `GET /api/sessions`

2. **Session already running (409)**:
   - Wait for current execution to complete
   - Or stop it: `POST /api/sessions/{id}/stop`

## File Locations

- **Sessions**: `~/.cchighway/sessions/{id}/`
- **History**: `~/.cchighway/sessions/{id}/stream.json`
- **Server Info**: `~/.cchighway/server-info.json`
- **Logs**: `~/.cchighway/logs/`

## Development

### Watch Mode

```bash
npm run dev
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

### Build

```bash
npm run build
```

## Next Steps

- Read the full [API Documentation](./API.md)
- Explore session management features
- Integrate with your own applications
- Set up multiple concurrent sessions
