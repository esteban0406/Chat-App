"use client";

import { useEffect, useMemo, useState } from "react";
import { getMe, User } from "@/lib/auth";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

export default function InviteForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [friendsRes, user] = await Promise.all([
          backendFetch("/api/friendships", { cache: "no-store" }),
          getMe(),
        ]);
        if (!cancelled) {
          if (friendsRes.ok) {
            const body = await friendsRes.json();
            const list = unwrapList<User>(body, "friends");
            setFriends(list);
          }
          if (user) {
            setCurrentUser(user);
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setFriends([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);
  const currentUserId = currentUser?.id;

  const handleSearch = async () => {
    const term = query.trim();
    if (!term) {
      setStatus("Ingresa un nombre de usuario");
      setResults([]);
      return;
    }

    setSearching(true);
    setStatus(null);
    try {
      const res = await backendFetch(
        `/api/users/search?username=${encodeURIComponent(term)}`
      );
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo buscar usuarios");
        throw new Error(msg);
      }
      const body = await res.json();
      const users = unwrapList<User>(body, "users");

      const filtered = users.filter((user: User) => {
        if (!user?.id) return false;
        if (user.id === currentUserId) return false;
        if (friendIds.has(user.id)) return false;
        return true;
      });

      if (!filtered.length) {
        setStatus("No se encontraron usuarios disponibles");
      }

      setResults(filtered);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Error al buscar usuarios";
      setStatus(message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (user: User) => {
    if (!user?.id) return;
    setSendingId(user.id);
    setStatus(null);
    try {
      const res = await backendFetch("/api/friendships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: user.id }),
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo enviar la invitación");
        throw new Error(msg);
      }
      setStatus(`Invitación enviada a ${user.username}`);
      setResults((prev) => prev.filter((candidate) => candidate.id !== user.id));
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Error al enviar invitación";
      setStatus(message);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-4 rounded-lg bg-gray-800 p-4 shadow-md">
      <h3 className="text-lg font-semibold">Agregar amigos</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre de usuario"
          className="flex-1 rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between rounded bg-gray-700 px-4 py-2 text-sm"
            >
              <span className="truncate">
                {user.username}{" "}
                <span className="text-gray-400">({user.email})</span>
              </span>
              <button
                type="button"
                onClick={() => handleInvite(user)}
                disabled={sendingId === user.id}
                className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-60"
              >
                {sendingId === user.id ? "Enviando..." : "Invitar"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {status && <p className="text-sm text-gray-300">{status}</p>}
    </div>
  );
}
