"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection } from "@mavisakalyan/ws-relay-react";
import { ConnectForm } from "@/components/chat/ConnectForm";
import { ChatLayout } from "@/components/chat/ChatLayout";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  );
}

const DEFAULT_RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL ?? "ws://localhost:8080/ws";

function ChatPage() {
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get("room") ?? "";
  const initialRelay = searchParams.get("relay") ?? DEFAULT_RELAY_URL;

  const [session, setSession] = useState<{ roomId: string; username: string } | null>(null);
  const { status, rttMs, connect, disconnect, sendChat } = useConnection();

  const handleConnect = useCallback(
    (relayUrl: string, roomId: string, username: string) => {
      connect({ url: relayUrl, roomId, username });
      setSession({ roomId, username });
    },
    [connect],
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
    setSession(null);
  }, [disconnect]);

  if (!session) {
    return (
      <ConnectForm
        defaultRelayUrl={initialRelay}
        defaultRoomId={initialRoom}
        onConnect={handleConnect}
      />
    );
  }

  return (
    <ChatLayout
      roomId={session.roomId}
      status={status}
      rttMs={rttMs}
      onSend={sendChat}
      onDisconnect={handleDisconnect}
    />
  );
}
