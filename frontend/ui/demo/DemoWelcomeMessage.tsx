"use client";

import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DemoWelcomeMessage() {
  const { t } = useTranslation("demo");

  return (
    <div className="flex items-start gap-3 border-b border-border/40 px-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold text-deep">
        <Bot className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gold">{t("welcome.author")}</span>
          <span className="text-xs text-text-muted">{t("welcome.time")}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-text-primary">
          {t("welcome.body")}
        </p>
      </div>
    </div>
  );
}
