"use client";

import { useTranslation } from "react-i18next";
import FriendRequestsList from "@/ui/home/FriendRequestsList";

export default function FriendRequestsPage() {
  const { t } = useTranslation("home");
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-text-primary">
        {t('tabs.friendRequests')}
      </h2>
      <FriendRequestsList />
    </div>
  );
}
