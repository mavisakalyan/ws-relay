"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@mavisakalyan/ws-relay-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "@mavisakalyan/ws-relay-client";

export interface MessageListProps {
  onReply?: (msg: ChatMessage) => void;
}

export function MessageList({ onReply }: MessageListProps) {
  const messages = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onReply={onReply} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
