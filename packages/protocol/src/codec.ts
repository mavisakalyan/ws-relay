/**
 * Codec — msgpack binary encode/decode + runtime validation.
 */

import { encode, decode } from "@msgpack/msgpack";
import type {
  AnyMessage,
  ServerMessage,
  RelayAnnounceData,
  RelayChatData,
} from "./types.js";

// ============================================================================
// ENCODE / DECODE
// ============================================================================

/** Encode a message to binary msgpack. Returns Uint8Array for WebSocket.send(). */
export function encodeMessage(message: AnyMessage): Uint8Array {
  return encode(message);
}

/**
 * Decode a received WebSocket message.
 * Supports binary (msgpack) and string (JSON fallback).
 */
export function decodeMessage(data: unknown): unknown {
  try {
    if (data instanceof ArrayBuffer) {
      return decode(new Uint8Array(data));
    }
    if (ArrayBuffer.isView(data)) {
      const view = data as ArrayBufferView;
      return decode(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    }
    if (typeof data === "string") {
      return JSON.parse(data);
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function isServerMessage(v: unknown): v is ServerMessage {
  if (!isObject(v)) return false;
  const { type } = v;
  if (type === "welcome") {
    return typeof v.playerId === "string" && Array.isArray(v.peers);
  }
  if (type === "peer_joined" || type === "peer_left") {
    return typeof v.peerId === "string";
  }
  if (type === "relay") {
    return typeof v.from === "string";
  }
  if (type === "pong") {
    return typeof v.nonce === "string" && typeof v.serverTime === "number";
  }
  if (type === "error") {
    return typeof v.code === "string" && typeof v.message === "string";
  }
  return false;
}

export function isAnnounceData(v: unknown): v is RelayAnnounceData {
  return isObject(v) && v.type === "announce" && typeof v.username === "string";
}

export function isChatData(v: unknown): v is RelayChatData {
  return isObject(v) && v.type === "chat" && typeof v.text === "string" && typeof v.timestamp === "number";
}
