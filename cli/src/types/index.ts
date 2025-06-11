// CCHighway Type Definitions

// Session related types
export interface Session {
  id: string;
  claudeSessionId?: string;
  workDir: string;
  status: "idle" | "running" | "completed" | "error";
  createdAt: Date;
  updatedAt: Date;
  lastPrompt?: string;
  totalCost?: number;
  turnCount: number;
}

// Stream data types
export interface StreamData {
  type: "assistant" | "user" | "result";
  session_id: string;
  message?: {
    id: string;
    content:
      | string
      | Array<{
          type: string;
          text?: string;
          [key: string]: unknown;
        }>;
    role: "assistant" | "user";
    [key: string]: unknown;
  };
  subtype?: "success" | "error" | "max_turns_reached";
  cost_usd?: number;
  duration_ms?: number;
  duration_api_ms?: number;
  is_error?: boolean;
  num_turns?: number;
  result?: string;
}
