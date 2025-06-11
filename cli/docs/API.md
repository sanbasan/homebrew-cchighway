# CCHighway Local Server API Documentation

## Overview

CCHighway provides a REST API for managing Claude Code sessions and executing AI conversations through a local server interface.

**Base URL**: `http://localhost:3000`

**API Version**: 1.0.0

---

## Authentication

Currently, no authentication is required. The server runs locally and listens on localhost only.

---

## Endpoints

### Health Check

#### `GET /health`

Basic health check endpoint to verify server status.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-06-11T03:56:15.291Z"
}
```

**Status Codes**:
- `200 OK` - Server is healthy

---

### Session Management

#### `GET /api/sessions`

Retrieve all available sessions.

**Response**:
```json
{
  "sessions": [
    {
      "id": "uuid-string",
      "workDir": "/path/to/work/directory",
      "status": "idle|running|completed|error",
      "createdAt": "2025-06-11T03:56:15.291Z",
      "updatedAt": "2025-06-11T03:56:15.291Z",
      "lastPrompt": "string",
      "totalCost": 0.003,
      "turnCount": 5
    }
  ]
}
```

**Status Codes**:
- `200 OK` - Sessions retrieved successfully

---

#### `POST /api/sessions`

Create a new session.

**Request Body**:
```json
{
  "workDir": "/optional/work/directory"
}
```

**Response**:
```json
{
  "session": {
    "id": "uuid-string",
    "workDir": "/path/to/work/directory",
    "status": "idle",
    "createdAt": "2025-06-11T03:56:15.291Z",
    "updatedAt": "2025-06-11T03:56:15.291Z",
    "turnCount": 0
  }
}
```

**Status Codes**:
- `201 Created` - Session created successfully
- `400 Bad Request` - Invalid request data

---

#### `GET /api/sessions/:id`

Get details for a specific session.

**Parameters**:
- `id` (string) - Session UUID

**Response**:
```json
{
  "session": {
    "id": "uuid-string",
    "workDir": "/path/to/work/directory",
    "status": "idle|running|completed|error",
    "createdAt": "2025-06-11T03:56:15.291Z",
    "updatedAt": "2025-06-11T03:56:15.291Z",
    "lastPrompt": "string",
    "totalCost": 0.003,
    "turnCount": 5
  }
}
```

**Status Codes**:
- `200 OK` - Session found
- `404 Not Found` - Session not found

---

#### `GET /api/sessions/:id/history`

Retrieve the complete conversation history for a session.

**Parameters**:
- `id` (string) - Session UUID

**Response**:
```json
{
  "sessionId": "uuid-string",
  "history": [
    {
      "type": "assistant|user|result",
      "message": {
        "role": "assistant|user",
        "content": "string"
      },
      "session_id": "uuid-string"
    }
  ]
}
```

**Status Codes**:
- `200 OK` - History retrieved successfully
- `404 Not Found` - Session not found

---

#### `DELETE /api/sessions/:id`

Delete a session and all associated data.

**Parameters**:
- `id` (string) - Session UUID

**Status Codes**:
- `204 No Content` - Session deleted successfully
- `400 Bad Request` - Cannot delete running session
- `404 Not Found` - Session not found

---

### Execution Management

#### `POST /api/execute`

Start a new execution (creates new session automatically).

**Request Body**:
```json
{
  "prompt": "Your question or instruction",
  "workDir": "/optional/work/directory"
}
```

**Response**:
```json
{
  "sessionId": "uuid-string",
  "processId": "uuid-string",
  "status": "running"
}
```

**Status Codes**:
- `201 Created` - Execution started successfully
- `400 Bad Request` - Missing or invalid prompt
- `500 Internal Server Error` - Failed to start Claude Code

---

#### `POST /api/sessions/:id/execute`

Continue execution on an existing session.

**Parameters**:
- `id` (string) - Session UUID

**Request Body**:
```json
{
  "prompt": "Your question or instruction"
}
```

**Response**:
```json
{
  "sessionId": "uuid-string",
  "processId": "uuid-string",
  "status": "running"
}
```

**Status Codes**:
- `200 OK` - Execution continued successfully
- `400 Bad Request` - Missing prompt or invalid session
- `404 Not Found` - Session not found
- `409 Conflict` - Session is already running

---

#### `POST /api/sessions/:id/stop`

Stop execution for a specific session.

**Parameters**:
- `id` (string) - Session UUID

**Response**:
```json
{
  "sessionId": "uuid-string",
  "status": "stopped|not_running"
}
```

**Status Codes**:
- `200 OK` - Stop request processed
- `404 Not Found` - Session not found

---

### Server Status

#### `GET /api/status`

Get comprehensive server status and statistics.

**Response**:
```json
{
  "server": {
    "status": "running",
    "uptime": 3600.5,
    "timestamp": "2025-06-11T03:56:15.291Z"
  },
  "sessions": {
    "total": 10,
    "active": 2,
    "completed": 7,
    "error": 1
  },
  "watchers": {
    "active": 2,
    "states": {}
  },
  "parsers": {
    "active": 2,
    "stats": {}
  },
  "memory": {
    "usage": {
      "rss": 123456789,
      "heapTotal": 87654321,
      "heapUsed": 65432109,
      "external": 12345678,
      "arrayBuffers": 1234567
    }
  }
}
```

**Status Codes**:
- `200 OK` - Status retrieved successfully

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2025-06-11T03:56:15.291Z"
  }
}
```

### Common Error Codes

- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., session already running)
- `500 Internal Server Error` - Server error

---

## Session States

- `idle` - Session created but not executing
- `running` - Currently executing Claude Code
- `completed` - Execution completed successfully
- `error` - Execution failed or encountered error

---

## Data Persistence

- **Sessions**: Stored in `~/.cchighway/sessions/{id}/session.json`
- **History**: Stored in `~/.cchighway/sessions/{id}/stream.json` (NDJSON format)
- **Server Info**: Stored in `~/.cchighway/server-info.json`

---

## Examples

### Basic Usage Flow

1. **Create a session**:
   ```bash
   curl -X POST http://localhost:3000/api/sessions \
     -H "Content-Type: application/json" \
     -d '{"workDir": "/my/project"}'
   ```

2. **Execute a prompt**:
   ```bash
   curl -X POST http://localhost:3000/api/sessions/{session-id}/execute \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Help me debug this Python script"}'
   ```

3. **Get conversation history**:
   ```bash
   curl http://localhost:3000/api/sessions/{session-id}/history
   ```

### Quick Execution (Auto-creates Session)

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the capital of Japan?"}'
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Session IDs are UUIDs
- The server runs on localhost only for security
- Claude Code must be installed and accessible in PATH
- Stream data follows NDJSON format (one JSON object per line)