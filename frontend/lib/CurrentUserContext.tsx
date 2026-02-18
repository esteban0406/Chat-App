"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getMe, User } from "@/lib/auth";

type CurrentUserState = {
  currentUser: User | null;
  loading: boolean;
  refreshUser: () => void;
};

const CurrentUserContext = createContext<CurrentUserState>({
  currentUser: null,
  loading: true,
  refreshUser: () => {},
});

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    setLoading(true);
    getMe().then((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <CurrentUserContext.Provider value={{ currentUser, loading, refreshUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
