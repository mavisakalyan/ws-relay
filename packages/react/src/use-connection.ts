import { useState, useEffect, useCallback, useRef } from "react";
import {
  RelayClient,
  createRelayClient,
  type RelayClientOptions,
  type ConnectionStatus,
} from "@mavisakalyan/ws-relay-client";

export interface UseConnectionReturn {
  status: ConnectionStatus;
  rttMs: number | null;
  client: RelayClient | null;
  connect: (options: RelayClientOptions) => void;
  disconnect: () => void;
  sendChat: (text: string, replyTo?: { id: string; text: string; username: string }) => void;
}

/**
 * Manages a RelayClient lifecycle in React.
 * Returns status, RTT, and action functions.
 */
export function useConnection(): UseConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [rttMs, setRttMs] = useState<number | null>(null);
  const clientRef = useRef<RelayClient | null>(null);

  const connect = useCallback((options: RelayClientOptions) => {
    // Disconnect existing
    clientRef.current?.disconnect();

    const client = createRelayClient(options);
    clientRef.current = client;

    client.subscribeConnection((s, rtt) => {
      setStatus(s);
      setRttMs(rtt);
    });

    client.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setStatus("disconnected");
    setRttMs(null);
  }, []);

  const sendChat = useCallback(
    (text: string, replyTo?: { id: string; text: string; username: string }) => {
      clientRef.current?.sendChat(text, replyTo);
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => { clientRef.current?.disconnect(); };
  }, []);

  return {
    status,
    rttMs,
    client: clientRef.current,
    connect,
    disconnect,
    sendChat,
  };
}
