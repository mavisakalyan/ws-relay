# @mavisakalyan/ws-relay-protocol

Message types and msgpack codec for WebSocket relay servers.

This is the lowest-level package in the ws-relay stack. It defines the message shapes that clients and servers speak, plus encode/decode functions using msgpack binary format.

## Install

```bash
npm install @mavisakalyan/ws-relay-protocol
```

> Most people don't need to install this directly. If you use `@mavisakalyan/ws-relay-client` or `@mavisakalyan/ws-relay-react`, this comes as a dependency.

## What's inside

### Message types

**Client → Server:**

```typescript
import type {
  ClientHelloMessage,     // { type: "hello", protocolVersion: 1 }
  ClientAnnounceMessage,  // { type: "announce", username: "Alice" }
  ClientChatMessage,      // { type: "chat", id, text, username, timestamp, replyTo? }
  ClientPingMessage,      // { type: "ping", nonce, clientTime }
  ClientMessage,          // Union of all above
} from "@mavisakalyan/ws-relay-protocol";
```

**Server → Client:**

```typescript
import type {
  ServerWelcomeMessage,     // { type: "welcome", playerId, peers: [] }
  ServerPeerJoinedMessage,  // { type: "peer_joined", peerId }
  ServerPeerLeftMessage,    // { type: "peer_left", peerId }
  ServerRelayMessage,       // { type: "relay", from, data }
  ServerPongMessage,        // { type: "pong", nonce, serverTime }
  ServerErrorMessage,       // { type: "error", code, message }
  ServerMessage,            // Union of all above
} from "@mavisakalyan/ws-relay-protocol";
```

**Relay data shapes** (what's inside `relay.data`):

```typescript
import type {
  RelayAnnounceData,  // { type: "announce", username }
  RelayChatData,      // { type: "chat", id?, text, username?, timestamp, replyTo? }
} from "@mavisakalyan/ws-relay-protocol";
```

### Codec

```typescript
import { encodeMessage, decodeMessage } from "@mavisakalyan/ws-relay-protocol";

// Encode to binary (Uint8Array) for WebSocket.send()
const bytes = encodeMessage({ type: "chat", id: "1", text: "hi", username: "Alice", timestamp: Date.now() });

// Decode from binary or JSON string
const msg = decodeMessage(event.data);
```

### Validation

```typescript
import { isServerMessage, isAnnounceData, isChatData } from "@mavisakalyan/ws-relay-protocol";

const parsed = decodeMessage(event.data);
if (isServerMessage(parsed)) {
  // parsed is typed as ServerMessage
}
```

## Protocol overview

The relay server is **protocol-agnostic**. It doesn't inspect your messages. It just:

1. Assigns each client a `playerId` on connect
2. Sends `welcome` with the list of peers in the room
3. Wraps any message you send in `{ type: "relay", from: yourId, data: yourMessage }` and forwards to all other peers
4. Notifies peers on join/leave

```
Client A                    Server                    Client B
   │                          │                          │
   │── connect ──────────────→│                          │
   │←── welcome (id, peers) ──│                          │
   │                          │                          │
   │── { type: "chat", ... } →│                          │
   │                          │── relay { from: A } ────→│
   │                          │                          │
```

## Compatible servers

Any of these relay servers speak this protocol:

- [node-ws-gameserver](https://github.com/mavisakalyan/node-ws-gameserver) — Node.js
- [bun-ws-gameserver](https://github.com/mavisakalyan/bun-ws-gameserver) — Bun
- [cloudflare-ws-gameserver](https://github.com/mavisakalyan/cloudflare-ws-gameserver) — Cloudflare Workers

Or build your own — any server that relays msgpack messages in the format above will work.

## Related packages

| Package | What it adds |
|---------|-------------|
| [`@mavisakalyan/ws-relay-client`](https://www.npmjs.com/package/@mavisakalyan/ws-relay-client) | WebSocket client with chat store, users store, reconnection |
| [`@mavisakalyan/ws-relay-react`](https://www.npmjs.com/package/@mavisakalyan/ws-relay-react) | React hooks: `useChat`, `useUsers`, `useConnection` |

## License

GPL-3.0-only
