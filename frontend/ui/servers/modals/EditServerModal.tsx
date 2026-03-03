"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Server, Member } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

type Props = {
  server: Server;
  onClose: () => void;
  onMemberRemoved?: (memberID: string) => void;
};

export default function EditServerModal({
  server,
  onClose,
  onMemberRemoved,
}: Props) {
  const { t } = useTranslation(["servers", "common"]);
  const [removingId, setRemovingId] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  if (!server) return null;

  const members: Member[] = server.members ?? [];

  const handleRemove = async (member: Member) => {
    setRemovingId(member.id);
    setError(null);
    try {
      const res = await backendFetch(
        `/api/servers/${server.id}/members/${member.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const msg = await extractErrorMessage(res, t('members.removeError'));
        throw new Error(msg);
      }
      onMemberRemoved?.(member.id);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t('members.removeError');
      setError(message);
    } finally {
      setRemovingId(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg bg-deep border border-border p-6 text-white shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{t('servers:members.title', { name: server.name })}</h3>
          <p className="text-sm text-text-muted">
            {t('servers:members.description')}
          </p>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
          {members.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t('servers:members.empty')}
            </p>
          ) : (
            members.map((member) => {
              if (member.userId !== server.ownerId) {
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded bg-surface px-3 py-2 text-sm"
                  >
                    <span>{`${member.user?.username ?? t('members.user')} (${member.user?.email ?? ""})`}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      disabled={removingId === member.id}
                      className="rounded bg-ruby px-3 py-1 text-xs font-semibold text-white hover:bg-ruby/90 disabled:opacity-60"
                    >
                      {t('servers:members.remove')}
                    </button>
                  </div>
                );
              }
              return null;
            })
          )}
        </div>

        {error ? <p className="mt-3 text-sm text-ruby">{error}</p> : null}

        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface/80"
          >
            {t('common:close')}
          </button>
        </div>
      </div>
    </div>
  );
}
