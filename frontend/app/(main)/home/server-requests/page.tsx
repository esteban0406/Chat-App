"use client";

import { useTranslation } from "react-i18next";
import ServerInviteList from "@/ui/home/ServerInviteList";

export default function ServerRequestsPage() {
  const { t } = useTranslation("home");
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-text-primary">
        {t('serverInvites.heading')}
      </h2>
      <ServerInviteList />
    </div>
  );
}
