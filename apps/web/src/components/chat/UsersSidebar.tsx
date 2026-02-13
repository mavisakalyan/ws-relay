"use client";

import { useUsers } from "@mavisakalyan/ws-relay-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function UsersSidebar() {
  const users = useUsers();

  return (
    <div className="w-48 border-l flex flex-col bg-card">
      <div className="px-3 py-2 border-b">
        <h3 className="text-sm font-medium">Online ({users.length})</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {users.map((user) => (
            <div
              key={user.playerId}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                user.isLocal && "bg-primary/20"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {user.username}
                {user.isLocal && " (you)"}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
