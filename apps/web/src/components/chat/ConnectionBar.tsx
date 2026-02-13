"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@mavisakalyan/ws-relay-client";

export interface ConnectionBarProps {
  roomId: string;
  status: ConnectionStatus;
  rttMs: number | null;
  onDisconnect: () => void;
}

export function ConnectionBar({
  roomId,
  status,
  rttMs,
  onDisconnect,
}: ConnectionBarProps) {
  const statusLabel =
    status === "connected"
      ? "connected"
      : status === "connecting"
        ? "connecting"
        : "disconnected";

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-card">
      <div className="flex items-center gap-2">
        <Badge
          variant={status === "connected" ? "default" : status === "connecting" ? "secondary" : "destructive"}
          className="text-xs"
        >
          {statusLabel}
        </Badge>
        <span className="text-sm text-muted-foreground">Room: {roomId}</span>
        {rttMs !== null && status === "connected" && (
          <span className="text-xs text-muted-foreground font-mono">
            {rttMs} ms
          </span>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onDisconnect}>
        Disconnect
      </Button>
    </div>
  );
}
