"use client";

import { useTranslation } from "react-i18next";
import FriendList from "@/ui/home/FriendList";

export default function FriendsPage() {
  const { t } = useTranslation("home");
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-text-primary">{t('friends.heading')}</h2>
      <FriendList />
    </div>
  );
}
