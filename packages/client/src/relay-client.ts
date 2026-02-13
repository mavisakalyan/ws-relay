/**
 * Relay Client — chat-only WebSocket client.
 *
 * Connects to any mavisakalyan/*-ws-gameserver relay.
 * Handles: connect lifecycle, announce, chat (with replies), ping/pong.
 * Ignores: snapshot, position, and any other game-specific relay payloads.
 */

import {
  PROTOCOL_VERSION,
  encodeMessage,
  decodeMessage,
  isServerMessage,
  isAnnounceData,
  isChatData,
  type ClientMessage,
  type ClientHelloMessage,
  type ClientAnnounceMessage,
  type ClientChatMessage,
  type ClientPingMessage,
  type ServerMessage,
  type RelayChatData,
} from "@mavisakalyan/ws-relay-protocol";
import { addChatMessage, addSystemMessage, clearChatMessages } from "./chat-store.js";
import {
  setLocalUser,
  addUser,
  removeUser,
  updateUsername,
  clearUsers,
  setBulkPeers,
} from "./users-store.js";

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface RelayClientOptions {
  /** Full relay base URL, e.g. "wss://relay.example.com/ws" */
  url: string;
  /** Room to join, e.g. "lobby" */
  roomId: string;
  /** Display name for this client */
  username: string;
}

export type ConnectionListener = (status: ConnectionStatus, rttMs: number | null) => void;

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_CHAT_LENGTH = 500;
const PING_INTERVAL_MS = 5_000;

// ============================================================================
// UTIL
// ============================================================================

function backoffMs(attempt: number): number {
  const base = Math.min(10_000, 250 * 2 ** attempt);
  return base + Math.random() * 250;
}

function randomNonce(): string {
  return `n_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

let globalMessageCounter = 0;

export function generateMessageId(): string {
  return `msg_${++globalMessageCounter}_${Date.now()}`;
}

// ============================================================================
// CLIENT
// ============================================================================

export class RelayClient {
  private readonly url: string;
  private readonly roomId: string;
  private readonly username: string;

  private ws: WebSocket | null = null;
  private wsGeneration = 0;
  private _status: ConnectionStatus = "disconnected";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pendingPingNonce: string | null = null;
  private pendingPingAt: number | null = null;
  private rttMs: number | null = null;

  private localPlayerId: string | null = null;
  private connectionListeners = new Set<ConnectionListener>();

  constructor(options: RelayClientOptions) {
    this.url = options.url;
    this.roomId = options.roomId;
    this.username = options.username;
  }

  // ── PUBLIC API ─────────────────────────────────────────────────

  get status(): ConnectionStatus { return this._status; }
  get playerId(): string | null { return this.localPlayerId; }
  get currentRttMs(): number | null { return this.rttMs; }

  subscribeConnection(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  connect(): void {
    if (this.ws || this._status === "connecting" || this._status === "connected") return;
    this.setStatus("connecting");

    const gen = ++this.wsGeneration;
    const wsUrl = `${this.url}/${encodeURIComponent(this.roomId)}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.addEventListener("open", () => {
      if (this.wsGeneration !== gen) return;
      this.setStatus("connected");
      this.reconnectAttempt = 0;
      const hello: ClientHelloMessage = { type: "hello", protocolVersion: PROTOCOL_VERSION };
      this.send(hello);
      this.startPing();
    });

    ws.addEventListener("message", (evt) => {
      if (this.wsGeneration !== gen) return;
      const parsed = decodeMessage(evt.data);
      if (!isServerMessage(parsed)) return;
      this.handleServerMessage(parsed);
    });

    ws.addEventListener("close", () => {
      if (this.wsGeneration !== gen) return;
      this.cleanupSocket();
      this.scheduleReconnect();
    });

    ws.addEventListener("error", () => {});
  }

  disconnect(): void {
    this.wsGeneration++;
    this.clearReconnect();
    this.stopPing();
    this.cleanupSocket(true);
    this.setStatus("disconnected");
    this.localPlayerId = null;
    this.rttMs = null;
    clearChatMessages();
    clearUsers();
  }

  sendChat(
    text: string,
    replyTo?: { id: string; text: string; username: string },
  ): void {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_CHAT_LENGTH) return;

    const id = generateMessageId();
    const msg: ClientChatMessage = {
      type: "chat",
      id,
      text: trimmed,
      username: this.username,
      timestamp: Date.now(),
    };
    if (replyTo) {
      msg.replyTo = {
        id: replyTo.id,
        text: replyTo.text.slice(0, 100),
        username: replyTo.username,
      };
    }

    this.send(msg);

    addChatMessage({
      id,
      from: this.localPlayerId ?? "local",
      text: trimmed,
      username: this.username,
      timestamp: msg.timestamp,
      isLocal: true,
      replyTo: replyTo
        ? { id: replyTo.id, text: replyTo.text.slice(0, 100), username: replyTo.username }
        : undefined,
    });
  }

  // ── INTERNALS ──────────────────────────────────────────────────

  private send(message: ClientMessage): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try { ws.send(encodeMessage(message)); } catch { /* ignore */ }
  }

  private setStatus(status: ConnectionStatus): void {
    this._status = status;
    for (const l of this.connectionListeners) l(status, this.rttMs);
  }

  private sendAnnounce(): void {
    const msg: ClientAnnounceMessage = { type: "announce", username: this.username };
    this.send(msg);
  }

  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case "welcome": {
        this.localPlayerId = message.playerId;
        setLocalUser(message.playerId, this.username);
        setBulkPeers(message.peers.filter((id) => id !== message.playerId));
        this.sendAnnounce();
        addSystemMessage(`Connected to room. ${message.peers.length} peer(s) online.`);
        return;
      }
      case "peer_joined": {
        if (message.peerId === this.localPlayerId) return;
        addUser(message.peerId);
        this.sendAnnounce();
        addSystemMessage(`A new user joined.`);
        return;
      }
      case "peer_left": {
        removeUser(message.peerId);
        addSystemMessage(`A user left.`);
        return;
      }
      case "relay": {
        if (message.from === this.localPlayerId) return;
        const data = message.data;
        if (isAnnounceData(data)) { updateUsername(message.from, data.username); return; }
        if (isChatData(data)) { this.handleIncomingChat(message.from, data); return; }
        return; // Ignore snapshots, etc.
      }
      case "pong": {
        if (this.pendingPingNonce && message.nonce === this.pendingPingNonce) {
          this.rttMs = Date.now() - (this.pendingPingAt ?? Date.now());
          this.pendingPingNonce = null;
          this.pendingPingAt = null;
          for (const l of this.connectionListeners) l(this._status, this.rttMs);
        }
        return;
      }
      case "error": {
        console.warn("[RelayClient] server error:", message.code, message.message);
        addSystemMessage(`Server error: ${message.message}`);
        return;
      }
    }
  }

  private handleIncomingChat(from: string, data: RelayChatData): void {
    const messageId = data.id ?? `remote_${++globalMessageCounter}_${data.timestamp}`;
    const username = data.username ?? from.slice(0, 8);
    addChatMessage({
      id: messageId,
      from,
      text: data.text,
      username,
      timestamp: data.timestamp,
      isLocal: false,
      replyTo: data.replyTo,
    });
  }

  private scheduleReconnect(): void {
    if (this._status === "disconnected") return;
    this.setStatus("disconnected");
    this.clearReconnect();
    const delay = backoffMs(this.reconnectAttempt++);
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = null; this.connect(); }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  private cleanupSocket(shouldClose = false): void {
    const ws = this.ws;
    this.ws = null;
    if (ws && shouldClose) { try { ws.close(); } catch { /* ignore */ } }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const nonce = randomNonce();
      this.pendingPingNonce = nonce;
      this.pendingPingAt = Date.now();
      this.send({ type: "ping", nonce, clientTime: Date.now() });
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    this.pendingPingNonce = null;
    this.pendingPingAt = null;
  }
}

export function createRelayClient(options: RelayClientOptions): RelayClient {
  return new RelayClient(options);
}
