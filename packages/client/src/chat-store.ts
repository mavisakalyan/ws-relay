/**
 * Chat Store
 *
 * Module-level pub/sub store for chat messages.
 * Supports replies (replyTo) and system messages.
 * Designed for useSyncExternalStore — immutable snapshots on every mutation.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ChatReplyTo {
  id: string;
  text: string;
  username: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  username: string;
  timestamp: number;
  isLocal: boolean;
  replyTo?: ChatReplyTo;
  isSystem?: boolean;
}

export interface AddChatMessageInput {
  id: string;
  from: string;
  text: string;
  username: string;
  timestamp: number;
  isLocal: boolean;
  replyTo?: ChatReplyTo;
}

// ============================================================================
// STORE
// ============================================================================

const MAX_MESSAGES = 500;
type Listener = () => void;

let messages: ChatMessage[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l();
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function addChatMessage(input: AddChatMessageInput): void {
  const msg: ChatMessage = { ...input, isSystem: false };
  messages = [...messages.slice(-(MAX_MESSAGES - 1)), msg];
  emit();
}

export function addSystemMessage(text: string): void {
  const msg: ChatMessage = {
    id: `sys_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    from: "system",
    text,
    username: "System",
    timestamp: Date.now(),
    isLocal: false,
    isSystem: true,
  };
  messages = [...messages.slice(-(MAX_MESSAGES - 1)), msg];
  emit();
}

export function getChatMessages(): ChatMessage[] {
  return messages;
}

export function subscribeChatMessages(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearChatMessages(): void {
  messages = [];
  emit();
}

export function findMessageById(id: string): ChatMessage | undefined {
  return messages.find((m) => m.id === id);
}
