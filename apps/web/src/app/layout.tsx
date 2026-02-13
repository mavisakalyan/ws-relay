import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ws-relay-chat",
  description: "WebSocket relay chat client with rooms and msgpack.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
