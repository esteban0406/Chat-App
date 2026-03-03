"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Friendship, User } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";
import { useNotificationSocket } from "@/lib/useNotificationSocket";

export default function FriendRequestsList() {
  const { t } = useTranslation("home");

  const [requests, setRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendFetch("/api/friendships/pending", {
        cache: "no-store",
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, t('requests.loadError'));
        throw new Error(msg);
      }
      const body = await res.json();
      const list = unwrapList<Friendship>(body, "requests");
      setRequests(list);
    } catch (err) {
      console.error(err);
      setRequests([]);
      const message = err instanceof Error ? err.message : t('requests.loadError');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadRequests(); }, []);

  useNotificationSocket({
    onFriendRequestReceived: (friendship) => {
      setRequests((prev) =>
        prev.some((r) => r.id === friendship.id) ? prev : [friendship, ...prev]
      );
    },
    onFriendRequestCancelled: ({ friendshipId }) => {
      setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    },
  });

  const handleResponse = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    setRespondingId(id);
    try {
      const res = await backendFetch(`/api/friendships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, t('requests.respondError'));
        throw new Error(msg);
      }
      setRequests((prev) => prev.filter((request) => request.id !== id));
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t('requests.respondError');
      setError(message);
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return <p className="text-text-muted">{t("requests.loading")}</p>;
  }

  if (error) {
    return <p className="text-ruby">{error}</p>;
  }

  if (!requests.length) {
    return <p className="text-text-muted">{t("requests.empty")}</p>;
  }

  return (
    <ul className="space-y-2">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex items-center justify-between rounded-lg border border-border bg-surface/30 px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-3 truncate">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-primary">
              {((request.sender as User)?.username?.[0] ?? "?").toUpperCase()}
            </div>
            <span className="truncate">
              <span className="font-medium text-text-primary">
                {(request.sender as User)?.username ?? t("requests.user")}
              </span>{" "}
              <span className="text-xs text-text-muted">
                ({(request.sender as User)?.email ?? t("requests.noEmail")})
              </span>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleResponse(request.id, "ACCEPTED")}
              disabled={respondingId === request.id}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-muted text-gold transition hover:bg-gold hover:text-deep disabled:opacity-60"
              aria-label={t("requests.accept")}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleResponse(request.id, "REJECTED")}
              disabled={respondingId === request.id}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ruby-muted text-ruby transition hover:bg-ruby hover:text-white disabled:opacity-60"
              aria-label={t("requests.reject")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
