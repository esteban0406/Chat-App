"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useNotificationSocket } from "../useNotificationSocket";

type NotificationState = {
  hasNewFriendRequests: boolean;
  hasNewServerInvites: boolean;
  clearFriendRequests: () => void;
  clearServerInvites: () => void;
};

const NotificationContext = createContext<NotificationState>({
  hasNewFriendRequests: false,
  hasNewServerInvites: false,
  clearFriendRequests: () => {},
  clearServerInvites: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasNewFriendRequests, setHasNewFriendRequests] = useState(false);
  const [hasNewServerInvites, setHasNewServerInvites] = useState(false);

  useNotificationSocket({
    onFriendRequestReceived: () => setHasNewFriendRequests(true),
    onServerInviteReceived: () => setHasNewServerInvites(true),
  });

  const clearFriendRequests = useCallback(() => setHasNewFriendRequests(false), []);
  const clearServerInvites = useCallback(() => setHasNewServerInvites(false), []);

  return (
    <NotificationContext.Provider
      value={{
        hasNewFriendRequests,
        hasNewServerInvites,
        clearFriendRequests,
        clearServerInvites,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
