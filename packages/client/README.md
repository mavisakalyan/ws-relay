# @mavisakalyan/ws-relay-client

WebSocket relay client with chat, users, and automatic reconnection. Works in any JavaScript environment.

## Install

```bash
npm install @mavisakalyan/ws-relay-client
```

This automatically installs `@mavisakalyan/ws-relay-protocol` (types + codec).

## Quick start

```typescript
import { createRelayClient, getChatMessages, subscribeChatMessages } from "@mavisakalyan/ws-relay-client";

// 1. Create a client
const client = createRelayClient({
  url: "wss://your-relay.example.com/ws",
  roomId: "lobby",
  username: "Alice",
});

// 2. Connect
client.connect();

// 3. Listen for messages
subscribeChatMessages(() => {
  const messages = getChatMessages();
  console.log("Messages:", messages);
});

// 4. Send a message
client.sendChat("Hello everyone!");

// 5. Send a reply
client.sendChat("I agree!", {
  id: "original-msg-id",
  text: "The original message text",
  username: "Bob",
});

// 6. Disconnect when done
client.disconnect();
```

## What you get

### RelayClient

The main class. Handles WebSocket connection, reconnection with exponential backoff, ping/pong keepalive, and announce messages.

```typescript
import { createRelayClient } from "@mavisakalyan/ws-relay-client";

const client = createRelayClient({
  url: "wss://relay.example.com/ws",  // Your relay server
  roomId: "my-room",                   // Room to join
  username: "Alice",                    // Display name
});

client.connect();

// Properties
client.status;       // "disconnected" | "connecting" | "connected"
client.playerId;     // Server-assigned ID (string | null)
client.currentRttMs; // Latest round-trip time (number | null)

// Listen for connection changes
const unsub = client.subscribeConnection((status, rttMs) => {
  console.log(`Status: ${status}, RTT: ${rttMs}ms`);
});

// Send chat
client.sendChat("Hello!");

// Disconnect
client.disconnect();
```

### Chat store

Module-level store for chat messages. Uses immutable snapshots — designed for `useSyncExternalStore` in React, but works anywhere.

```typescript
import {
  getChatMessages,
  subscribeChatMessages,
  addSystemMessage,
  clearChatMessages,
  findMessageById,
} from "@mavisakalyan/ws-relay-client";

// Subscribe to changes
const unsub = subscribeChatMessages(() => {
  const messages = getChatMessages();
  // messages: ChatMessage[]
  // Each message has: id, from, text, username, timestamp, isLocal, replyTo?, isSystem?
});

// Add a system message (join/leave notifications, etc.)
addSystemMessage("Alice joined the room");

// Find a specific message (for building reply previews)
const original = findMessageById("msg_1_1234567890");
```

### Users store

Tracks who's online. Updated automatically by the client when peers announce themselves.

```typescript
import { getUsers, subscribeUsers } from "@mavisakalyan/ws-relay-client";

const unsub = subscribeUsers(() => {
  const users = getUsers();
  // users: OnlineUser[]
  // Each user has: playerId, username, isLocal
  console.log(`${users.length} users online`);
});
```

## Types

```typescript
import type {
  ChatMessage,        // { id, from, text, username, timestamp, isLocal, replyTo?, isSystem? }
  ChatReplyTo,        // { id, text, username }
  AddChatMessageInput,// Input for addChatMessage()
  OnlineUser,         // { playerId, username, isLocal }
  ConnectionStatus,   // "disconnected" | "connecting" | "connected"
  RelayClientOptions, // { url, roomId, username }
} from "@mavisakalyan/ws-relay-client";
```

## You need a server

This is a client-side package. It connects to a WebSocket relay server:

- [node-ws-gameserver](https://github.com/mavisakalyan/node-ws-gameserver) — Node.js
- [bun-ws-gameserver](https://github.com/mavisakalyan/bun-ws-gameserver) — Bun
- [cloudflare-ws-gameserver](https://github.com/mavisakalyan/cloudflare-ws-gameserver) — Cloudflare Workers

Or any server that relays msgpack messages in `{ type: "relay", from, data }` format.

## Using with React?

Install [`@mavisakalyan/ws-relay-react`](https://www.npmjs.com/package/@mavisakalyan/ws-relay-react) instead — it wraps this package with hooks:

```tsx
import { useChat, useUsers, useConnection } from "@mavisakalyan/ws-relay-react";

const messages = useChat();       // auto-subscribes to chat store
const users = useUsers();         // auto-subscribes to users store
const { client, status } = useConnection({ url, roomId, username });
```

## License

GPL-3.0-only
