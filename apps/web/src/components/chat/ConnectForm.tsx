"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConnectFormProps {
  defaultRelayUrl: string;
  defaultRoomId: string;
  onConnect: (relayUrl: string, roomId: string, username: string) => void;
}

export function ConnectForm({
  defaultRelayUrl,
  defaultRoomId,
  onConnect,
}: ConnectFormProps) {
  const [relayUrl, setRelayUrl] = useState(defaultRelayUrl);
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(() => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Username is required");
      return;
    }
    const trimmedUrl = relayUrl.trim();
    if (!trimmedUrl.startsWith("ws://") && !trimmedUrl.startsWith("wss://")) {
      setError("Relay URL must start with ws:// or wss://");
      return;
    }
    const trimmedRoom = roomId.trim() || "lobby";
    setError(null);
    onConnect(trimmedUrl, trimmedRoom, trimmedUsername);
  }, [username, relayUrl, roomId, onConnect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ws-relay-chat</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect to a WebSocket relay to start chatting
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Relay URL</label>
            <Input
              value={relayUrl}
              onChange={(e) => setRelayUrl(e.target.value)}
              placeholder="ws://localhost:8080/ws"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Room</label>
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="lobby"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleConnect} className="w-full">
            Connect
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
