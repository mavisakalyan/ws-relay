"use client";

import { useState, useCallback } from "react";
import { ConnectionBar } from "./ConnectionBar";
import { UsersSidebar } from "./UsersSidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ConnectionStatus } from "@mavisakalyan/ws-relay-client";
import type { ChatMessage, ChatReplyTo } from "@mavisakalyan/ws-relay-client";

export interface ChatLayoutProps {
  roomId: string;
  status: ConnectionStatus;
  rttMs: number | null;
  onSend: (text: string, replyTo?: ChatReplyTo) => void;
  onDisconnect: () => void;
}

export function ChatLayout({
  roomId,
  status,
  rttMs,
  onSend,
  onDisconnect,
}: ChatLayoutProps) {
  const [replyTo, setReplyTo] = useState<ChatReplyTo | null>(null);

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyTo({ id: msg.id, text: msg.text, username: msg.username });
  }, []);

  const handleReplyCancel = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleSend = useCallback(
    (text: string, replyToPayload?: ChatReplyTo) => {
      onSend(text, replyToPayload);
      setReplyTo(null);
    },
    [onSend],
  );

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col">
        <ConnectionBar
          roomId={roomId}
          status={status}
          rttMs={rttMs}
          onDisconnect={onDisconnect}
        />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <MessageList onReply={handleReply} />
            <MessageInput
              onSend={handleSend}
              replyTo={replyTo}
              onReplyCancel={handleReplyCancel}
              disabled={status !== "connected"}
            />
          </div>
          <UsersSidebar />
        </div>
      </div>
    </TooltipProvider>
  );
}
