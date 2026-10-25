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
  updateCurrentUser: (user: User) => void;
};

const CurrentUserContext = createContext<CurrentUserState>({
  currentUser: null,
  loading: true,
  refreshUser: () => {},
  updateCurrentUser: () => {},
});

export function CurrentUserProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User;
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);

  const refreshUser = useCallback(() => {
    setLoading(true);
    getMe().then((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (initialUser) return;
    getMe().then((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, [initialUser]);

  return (
    <CurrentUserContext.Provider value={{ currentUser, loading, refreshUser, updateCurrentUser: setCurrentUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
