// Wire protocol for the AI chat WebSocket.
// These types mirror the backend Pydantic schemas in ut-taiwan-ai/app/ws/schemas.py
// exactly. Keep them in sync if the backend protocol changes.

export const MAX_MESSAGE_LENGTH = 4000;

// Client to server
export interface UserMessagePayload {
  type: 'message';
  content: string;
  conversation_id: string | null;
}

export interface PingPayload {
  type: 'ping';
}

export type ClientMessage = UserMessagePayload | PingPayload;

// Server to client
export interface TokenPayload {
  type: 'token';
  content: string;
}

export interface DonePayload {
  type: 'done';
  conversation_id: string;
  message_id: string;
}

export type ServerErrorCode = 'INVALID_MESSAGE' | 'FORBIDDEN' | 'UPSTREAM_FAILURE' | 'RATE_LIMITED';

export interface ErrorPayload {
  type: 'error';
  code: ServerErrorCode;
  message: string;
}

export interface PongPayload {
  type: 'pong';
}

export type ServerMessage = TokenPayload | DonePayload | ErrorPayload | PongPayload;

// View model for rendering. Not part of the wire protocol.
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'streaming'
  | 'reconnecting'
  | 'expired'
  | 'closed';
