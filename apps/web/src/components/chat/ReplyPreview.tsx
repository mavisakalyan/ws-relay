"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatReplyTo } from "@mavisakalyan/ws-relay-client";

export interface ReplyPreviewProps {
  replyTo: ChatReplyTo;
  onCancel: () => void;
}

export function ReplyPreview({ replyTo, onCancel }: ReplyPreviewProps) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-muted/50 border-b">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">
          Replying to <span className="font-medium text-foreground">{replyTo.username}</span>
        </p>
        <p className="text-sm truncate">{replyTo.text}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={onCancel}
        aria-label="Cancel reply"
      >
        ×
      </Button>
    </div>
  );
}
