import { useSyncExternalStore } from "react";
import {
  getUsers,
  subscribeUsers,
  type OnlineUser,
} from "@mavisakalyan/ws-relay-client";

const EMPTY: OnlineUser[] = [];

/** Subscribe to online users. Returns sorted user list (local user first). */
export function useUsers(): OnlineUser[] {
  return useSyncExternalStore(subscribeUsers, getUsers, () => EMPTY);
}
