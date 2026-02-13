import { useSyncExternalStore } from "react";
import {
  getChatMessages,
  subscribeChatMessages,
  type ChatMessage,
} from "@mavisakalyan/ws-relay-client";

const EMPTY: ChatMessage[] = [];

/** Subscribe to chat messages. Returns the current messages array. */
export function useChat(): ChatMessage[] {
  return useSyncExternalStore(subscribeChatMessages, getChatMessages, () => EMPTY);
}
