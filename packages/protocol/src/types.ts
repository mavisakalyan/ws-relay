/**
 * Protocol Types
 *
 * Message shapes for the ws-gameserver relay protocol.
 * Compatible with node-ws-gameserver / bun-ws-gameserver / cloudflare-ws-gameserver.
 *
 * The relay server is protocol-agnostic: it wraps any msgpack payload in
 * { type: "relay", from: playerId, data: <original> } and broadcasts to peers.
 */

export const PROTOCOL_VERSION = 1 as const;

// ============================================================================
// CLIENT → SERVER
// ============================================================================

/** Sent once after connect. Server validates version, does NOT relay. */
export type ClientHelloMessage = {
  type: "hello";
  protocolVersion: number;
};

/** Sent once after receiving `welcome`, and again on every `peer_joined`. */
export type ClientAnnounceMessage = {
  type: "announce";
  username: string;
};

/** Chat message with optional reply. */
export type ClientChatMessage = {
  type: "chat";
  /** Client-generated unique ID. */
  id: string;
  text: string;
  username: string;
  timestamp: number;
  /** Present only if this message is a reply. */
  replyTo?: {
    id: string;
    text: string;
    username: string;
  };
};

/** Keepalive ping. Server responds with pong (not relayed). */
export type ClientPingMessage = {
  type: "ping";
  nonce: string;
  clientTime: number;
};

export type ClientMessage =
  | ClientHelloMessage
  | ClientAnnounceMessage
  | ClientChatMessage
  | ClientPingMessage;

// ============================================================================
// SERVER → CLIENT
// ============================================================================

export type ServerWelcomeMessage = {
  type: "welcome";
  protocolVersion: number;
  playerId: string;
  peers: string[];
};

export type ServerPeerJoinedMessage = {
  type: "peer_joined";
  peerId: string;
};

export type ServerPeerLeftMessage = {
  type: "peer_left";
  peerId: string;
};

export type ServerRelayMessage = {
  type: "relay";
  from: string;
  data: Record<string, unknown>;
};

export type ServerPongMessage = {
  type: "pong";
  nonce: string;
  serverTime: number;
};

export type ServerErrorMessage = {
  type: "error";
  code: string;
  message: string;
};

export type ServerMessage =
  | ServerWelcomeMessage
  | ServerPeerJoinedMessage
  | ServerPeerLeftMessage
  | ServerRelayMessage
  | ServerPongMessage
  | ServerErrorMessage;

// ============================================================================
// RELAY DATA SHAPES (extracted from relay.data)
// ============================================================================

export interface RelayAnnounceData {
  type: "announce";
  username: string;
}

export interface RelayChatData {
  type: "chat";
  id?: string;
  text: string;
  username?: string;
  timestamp: number;
  replyTo?: {
    id: string;
    text: string;
    username: string;
  };
}

export type AnyMessage = ClientMessage | ServerMessage;
