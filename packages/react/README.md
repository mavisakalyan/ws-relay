# @mavisakalyan/ws-relay-react

React hooks for WebSocket relay chat. Connect, send messages, track users — all in a few lines.

## Install

```bash
npm install @mavisakalyan/ws-relay-react
```

This automatically installs `@mavisakalyan/ws-relay-client` and `@mavisakalyan/ws-relay-protocol`.

## Quick start

```tsx
import { useConnection, useChat, useUsers } from "@mavisakalyan/ws-relay-react";

function Chat() {
  const { client, status } = useConnection({
    url: "wss://your-relay.example.com/ws",
    roomId: "lobby",
    username: "Alice",
  });

  const messages = useChat();
  const users = useUsers();

  return (
    <div>
      <p>{status} | {users.length} online</p>

      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            <b>{msg.username}</b>: {msg.text}
          </li>
        ))}
      </ul>

      <button onClick={() => client?.sendChat("Hello!")}>
        Send
      </button>
    </div>
  );
}
```

That's it. Connection lifecycle, reconnection, message stores — all handled.

## Hooks

### `useConnection(options)`

Creates and manages a `RelayClient`. Connects on mount, disconnects on unmount. Reconnects automatically on network drops.

```tsx
import { useConnection } from "@mavisakalyan/ws-relay-react";

const { client, status, rttMs } = useConnection({
  url: "wss://relay.example.com/ws",
  roomId: "lobby",
  username: "Alice",
});

// status: "disconnected" | "connecting" | "connected"
// rttMs: number | null (round-trip latency)
// client: RelayClient | null (use to send messages)

client?.sendChat("Hello!");
client?.sendChat("Reply!", { id: "msg-id", text: "Original", username: "Bob" });
```

### `useChat()`

Returns the current array of chat messages. Re-renders when new messages arrive.

```tsx
import { useChat } from "@mavisakalyan/ws-relay-react";

const messages = useChat();
// ChatMessage[] — each has: id, from, text, username, timestamp, isLocal, replyTo?, isSystem?
```

### `useUsers()`

Returns the list of online users. Re-renders when users join or leave.

```tsx
import { useUsers } from "@mavisakalyan/ws-relay-react";

const users = useUsers();
// OnlineUser[] — each has: playerId, username, isLocal
```

## Full example with replies

```tsx
import { useState } from "react";
import { useConnection, useChat } from "@mavisakalyan/ws-relay-react";
import type { ChatReplyTo } from "@mavisakalyan/ws-relay-react";

function ChatRoom() {
  const { client, status } = useConnection({
    url: "wss://relay.example.com/ws",
    roomId: "lobby",
    username: "Alice",
  });

  const messages = useChat();
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatReplyTo | null>(null);

  const send = () => {
    if (!input.trim() || !client) return;
    client.sendChat(input, replyTo ?? undefined);
    setInput("");
    setReplyTo(null);
  };

  return (
    <div>
      <p>Status: {status}</p>

      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.replyTo && (
            <small>↳ replying to {msg.replyTo.username}: {msg.replyTo.text}</small>
          )}
          <p>
            <b>{msg.isLocal ? "You" : msg.username}</b>: {msg.text}
            <button onClick={() => setReplyTo({ id: msg.id, text: msg.text, username: msg.username })}>
              reply
            </button>
          </p>
        </div>
      ))}

      {replyTo && (
        <div>
          Replying to {replyTo.username} <button onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
      <button onClick={send} disabled={status !== "connected"}>Send</button>
    </div>
  );
}
```

## Types

All commonly used types are re-exported for convenience:

```typescript
import type {
  ChatMessage,
  ChatReplyTo,
  OnlineUser,
  ConnectionStatus,
  RelayClientOptions,
} from "@mavisakalyan/ws-relay-react";
```

## You need a server

These hooks connect to a WebSocket relay server. Use any of these:

- [node-ws-gameserver](https://github.com/mavisakalyan/node-ws-gameserver) — Node.js
- [bun-ws-gameserver](https://github.com/mavisakalyan/bun-ws-gameserver) — Bun
- [cloudflare-ws-gameserver](https://github.com/mavisakalyan/cloudflare-ws-gameserver) — Cloudflare Workers

Or any server that speaks the [ws-relay-protocol](https://www.npmjs.com/package/@mavisakalyan/ws-relay-protocol).

## How it fits together

```
@mavisakalyan/ws-relay-react      ← You install this
  └── @mavisakalyan/ws-relay-client    ← Comes automatically
        └── @mavisakalyan/ws-relay-protocol  ← Comes automatically
```

- **react** = hooks (`useChat`, `useUsers`, `useConnection`)
- **client** = WebSocket client + stores (works without React too)
- **protocol** = types + msgpack codec (works anywhere)

## License

GPL-3.0-only
