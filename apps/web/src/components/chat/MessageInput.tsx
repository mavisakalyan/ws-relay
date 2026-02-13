"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReplyPreview } from "./ReplyPreview";
import type { ChatReplyTo } from "@mavisakalyan/ws-relay-client";

export interface MessageInputProps {
  onSend: (text: string, replyTo?: ChatReplyTo) => void;
  replyTo: ChatReplyTo | null;
  onReplyCancel: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  replyTo,
  onReplyCancel,
  disabled,
}: MessageInputProps) {
  const [input, setInput] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed, replyTo ?? undefined);
    setInput("");
  }, [input, replyTo, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onReplyCancel();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, onReplyCancel]
  );

  return (
    <div className="border-t">
      {replyTo && (
        <ReplyPreview replyTo={replyTo} onCancel={onReplyCancel} />
      )}
      <div className="flex gap-2 p-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Disconnected" : "Type a message..."}
          disabled={disabled}
          maxLength={500}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={disabled || !input.trim()} size="sm">
          Send
        </Button>
      </div>
    </div>
  );
}
