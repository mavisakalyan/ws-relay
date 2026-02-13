/**
 * Online Users Store
 *
 * Tracks peers in the current room with their display names.
 * Updated by the RelayClient on welcome/join/leave/announce events.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface OnlineUser {
  playerId: string;
  username: string;
  isLocal: boolean;
}

// ============================================================================
// STORE
// ============================================================================

type Listener = () => void;

let users: OnlineUser[] = [];
const listeners = new Set<Listener>();
const userMap = new Map<string, { username: string; isLocal: boolean }>();

function rebuildSnapshot(): void {
  const arr: OnlineUser[] = [];
  for (const [playerId, data] of userMap) {
    arr.push({ playerId, username: data.username, isLocal: data.isLocal });
  }
  arr.sort((a, b) => {
    if (a.isLocal && !b.isLocal) return -1;
    if (!a.isLocal && b.isLocal) return 1;
    return a.username.localeCompare(b.username);
  });
  users = arr;
}

function emit(): void {
  for (const l of listeners) l();
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function setLocalUser(playerId: string, username: string): void {
  userMap.set(playerId, { username, isLocal: true });
  rebuildSnapshot();
  emit();
}

export function addUser(playerId: string): void {
  if (userMap.has(playerId)) return;
  userMap.set(playerId, { username: playerId.slice(0, 8), isLocal: false });
  rebuildSnapshot();
  emit();
}

export function setBulkPeers(peerIds: string[]): void {
  for (const id of peerIds) {
    if (!userMap.has(id)) {
      userMap.set(id, { username: id.slice(0, 8), isLocal: false });
    }
  }
  rebuildSnapshot();
  emit();
}

export function updateUsername(playerId: string, username: string): void {
  const existing = userMap.get(playerId);
  if (existing) {
    existing.username = username;
  } else {
    userMap.set(playerId, { username, isLocal: false });
  }
  rebuildSnapshot();
  emit();
}

export function removeUser(playerId: string): void {
  userMap.delete(playerId);
  rebuildSnapshot();
  emit();
}

export function clearUsers(): void {
  userMap.clear();
  users = [];
  emit();
}

export function getUsers(): OnlineUser[] {
  return users;
}

export function subscribeUsers(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
