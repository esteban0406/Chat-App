"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { getSocket } from "./socket";
import type { Friendship, ServerInvite } from "./definitions";

type NotificationCallbacks = {
  onFriendRequestReceived?: (data: Friendship) => void;
  onFriendRequestResponded?: (data: Friendship) => void;
  onFriendRequestCancelled?: (data: { friendshipId: string; cancelledBy: string }) => void;
  onFriendshipRemoved?: (data: { friendshipId: string; removedBy: string }) => void;
  onServerInviteReceived?: (data: ServerInvite) => void;
  onServerInviteAccepted?: (data: { inviteId: string; receiverId: string; serverId: string; serverName: string }) => void;
  onServerInviteRejected?: (data: { inviteId: string; receiverId: string; serverId: string }) => void;
  onServerInviteCancelled?: (data: { inviteId: string; cancelledBy: string; serverId: string }) => void;
};

const EVENT_MAP: Record<string, keyof NotificationCallbacks> = {
  "friendRequest:received": "onFriendRequestReceived",
  "friendRequest:responded": "onFriendRequestResponded",
  "friendRequest:cancelled": "onFriendRequestCancelled",
  "friendship:removed": "onFriendshipRemoved",
  "serverInvite:received": "onServerInviteReceived",
  "serverInvite:accepted": "onServerInviteAccepted",
  "serverInvite:rejected": "onServerInviteRejected",
  "serverInvite:cancelled": "onServerInviteCancelled",
};

export function useNotificationSocket(callbacks: NotificationCallbacks) {
  const callbacksRef = useRef(callbacks);
  useLayoutEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const socket = getSocket();

    const handlers: [string, (data: unknown) => void][] = [];

    for (const [event, callbackKey] of Object.entries(EVENT_MAP)) {
      if (callbacksRef.current[callbackKey]) {
        const handler = (data: unknown) => {
          const cb = callbacksRef.current[callbackKey];
          if (cb) (cb as (data: unknown) => void)(data);
        };
        handlers.push([event, handler]);
        socket.on(event, handler);
      }
    }

    return () => {
      for (const [event, handler] of handlers) {
        socket.off(event, handler);
      }
    };
  }, []);
}
