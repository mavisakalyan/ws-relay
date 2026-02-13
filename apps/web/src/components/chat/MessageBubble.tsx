"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@mavisakalyan/ws-relay-client";

export interface MessageBubbleProps {
  message: ChatMessage;
  onReply?: (msg: ChatMessage) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message, onReply }: MessageBubbleProps) {
  if (message.isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-muted-foreground">{message.text}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex flex-col gap-0.5",
        message.isLocal ? "items-end" : "items-start"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">
          {message.username}
          {message.isLocal && " (you)"}
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          {formatTime(message.timestamp)}
        </span>
        {onReply && !message.isLocal && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onReply(message)}
          >
            Reply
          </Button>
        )}
      </div>
      <div
        className={cn(
          "px-2.5 py-1.5 rounded-lg text-sm max-w-[85%] break-words",
          message.isLocal
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {message.replyTo && (
          <div className="mb-1 pl-2 border-l-2 border-muted-foreground/30 text-xs text-muted-foreground">
            <span className="font-medium">{message.replyTo.username}: </span>
            {message.replyTo.text}
          </div>
        )}
        {message.text}
      </div>
    </div>
  );
}
