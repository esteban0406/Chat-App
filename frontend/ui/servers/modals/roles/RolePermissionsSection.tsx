"use client";

import { useTranslation } from "react-i18next";
import { Switch } from "@headlessui/react";
import { ServerPermission } from "@/lib/definitions";

const ALL_PERMISSIONS: ServerPermission[] = [
  "CREATE_CHANNEL",
  "DELETE_CHANNEL",
  "DELETE_SERVER",
  "INVITE_MEMBER",
  "REMOVE_MEMBER",
  "MANAGE_ROLES",
  "RENAME_SERVER",
];

type Props = {
  permissions: ServerPermission[];
  disabled: boolean;
  onToggle: (perm: ServerPermission) => void;
};

export default function RolePermissionsSection({
  permissions,
  disabled,
  onToggle,
}: Props) {
  const { t } = useTranslation("roles");
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {t('permissions.title')}
      </h4>

      <div className="space-y-1.5">
        {ALL_PERMISSIONS.map((perm) => {
          const enabled = permissions.includes(perm);
          return (
            <div
              key={perm}
              className="flex items-center justify-between rounded-lg bg-surface/40 px-3 py-2.5"
            >
              <span className="text-[13px] text-text-body">
                {t(`permissions.${perm}`)}
              </span>
              <Switch
                checked={enabled}
                onChange={() => onToggle(perm)}
                disabled={disabled}
                className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-deep disabled:opacity-50 ${
                  enabled ? "bg-gold" : "bg-surface"
                }`}
              >
                <span
                  className={`inline-block h-[18px] w-[18px] rounded-full transition-transform ${
                    enabled
                      ? "translate-x-5 bg-white"
                      : "translate-x-0.5 bg-text-muted"
                  }`}
                />
              </Switch>
            </div>
          );
        })}
      </div>
    </div>
  );
}
