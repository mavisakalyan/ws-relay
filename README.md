# ws-relay

Client-side packages for WebSocket relay servers. Chat with rooms, usernames, replies, and msgpack binary protocol.

## What is this?

A monorepo with three npm packages that give you a ready-made chat system on top of any WebSocket relay server. You get type-safe messages, automatic reconnection, and React hooks — all in ~15KB total.

```
┌─────────────────────────────────────────────────────────┐
│                    Your App (React)                     │
│                                                         │
│  useChat()  useUsers()  useConnection()                 │
│       ↓          ↓            ↓                         │
│  ┌─────────────────────────────────────┐                │
│  │   @mavisakalyan/ws-relay-react      │  React hooks   │
│  └──────────────┬──────────────────────┘                │
│                 ↓                                       │
│  ┌─────────────────────────────────────┐                │
│  │   @mavisakalyan/ws-relay-client     │  JS/TS client  │
│  └──────────────┬──────────────────────┘                │
│                 ↓                                       │
│  ┌─────────────────────────────────────┐                │
│  │   @mavisakalyan/ws-relay-protocol   │  Types + codec │
│  └──────────────┬──────────────────────┘                │
└─────────────────┼───────────────────────────────────────┘
                  ↓  WebSocket (msgpack binary)
┌─────────────────────────────────────────────────────────┐
│              Any ws-gameserver relay                    │
│                                                         │
│  node-ws-gameserver  OR  bun-ws-gameserver  OR  custom  │
└─────────────────────────────────────────────────────────┘
```

## Packages

| Package | npm | What it does |
|---------|-----|-------------|
| [`@mavisakalyan/ws-relay-protocol`](./packages/protocol) | [![npm](https://img.shields.io/npm/v/@mavisakalyan/ws-relay-protocol)](https://www.npmjs.com/package/@mavisakalyan/ws-relay-protocol) | Message types + msgpack encode/decode + validation |
| [`@mavisakalyan/ws-relay-client`](./packages/client) | [![npm](https://img.shields.io/npm/v/@mavisakalyan/ws-relay-client)](https://www.npmjs.com/package/@mavisakalyan/ws-relay-client) | WebSocket client with chat, users, reconnect |
| [`@mavisakalyan/ws-relay-react`](./packages/react) | [![npm](https://img.shields.io/npm/v/@mavisakalyan/ws-relay-react)](https://www.npmjs.com/package/@mavisakalyan/ws-relay-react) | React hooks: `useChat`, `useUsers`, `useConnection` |

There's also [`apps/web`](./apps/web) — a deployable Next.js chat app that uses all three packages. You can deploy it to Railway or Docker as a standalone chat client.

## Quick Start

### 1. You need a relay server

These packages are **client-side only**. They connect to a WebSocket relay server that handles rooms and message forwarding. Pick one:

| Server | Runtime | Deploy |
|--------|---------|--------|
| [node-ws-gameserver](https://github.com/mavisakalyan/node-ws-gameserver) | Node.js | Railway, Docker, any host |
| [bun-ws-gameserver](https://github.com/mavisakalyan/bun-ws-gameserver) | Bun | Railway, Docker, any host |
| [cloudflare-ws-gameserver](https://github.com/mavisakalyan/cloudflare-ws-gameserver) | Cloudflare Workers | Cloudflare edge |

All three implement the same msgpack relay protocol. Clients connect to any of them — just change the URL.

> You can also use **any WebSocket server** that speaks the same protocol: receives msgpack, wraps messages in `{ type: "relay", from, data }`, and broadcasts to peers. See the [protocol docs](./packages/protocol).

### 2. Install the packages

**React app** (most common):

```bash
npm install @mavisakalyan/ws-relay-react
# Automatically installs ws-relay-client and ws-relay-protocol as dependencies
```

**Vanilla JS/TS** (no React):

```bash
npm install @mavisakalyan/ws-relay-client
```

**Types only** (building your own client):

```bash
npm install @mavisakalyan/ws-relay-protocol
```

### 3. Use it

**React — full example in ~20 lines:**

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
      <p>Status: {status} | Users: {users.length}</p>

      {messages.map((msg) => (
        <div key={msg.id}>
          <b>{msg.username}</b>: {msg.text}
        </div>
      ))}

      <button onClick={() => client?.sendChat("Hello!")}>
        Send
      </button>
    </div>
  );
}
```

**Vanilla JS:**

```typescript
import { createRelayClient } from "@mavisakalyan/ws-relay-client";

const client = createRelayClient({
  url: "wss://your-relay.example.com/ws",
  roomId: "lobby",
  username: "Alice",
});

client.connect();
client.sendChat("Hello!");
client.sendChat("This is a reply", {
  id: "original-msg-id",
  text: "Original message text",
  username: "Bob",
});
```

## How the packages connect

```
You install ONE package. It pulls in what it needs:

@mavisakalyan/ws-relay-react
  └── @mavisakalyan/ws-relay-client
        └── @mavisakalyan/ws-relay-protocol
              └── @msgpack/msgpack
```

- **protocol** is the foundation — types, codec, validation. No runtime dependencies except msgpack.
- **client** adds the WebSocket connection, chat store, users store, reconnection logic. Works in any JS environment (browser, Node, Deno).
- **react** adds hooks that subscribe to the client's stores using `useSyncExternalStore`. Only useful in React apps.

## Apps

### `apps/web` — Deployable chat client

A Next.js app with a full chat UI (connect form, message list, replies, online users sidebar). Deploy it to Railway:

```bash
# From the monorepo root
cd apps/web
cp .env.example .env.local
# Edit .env.local with your relay server URL
pnpm dev
```

Or deploy with Docker — see the [Dockerfile](./apps/web/Dockerfile).

## Development

```bash
# Install
pnpm install

# Build all packages + app
pnpm build

# Typecheck
pnpm typecheck
```

## License

GPL-3.0-only
