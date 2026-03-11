"use client";

import { useEffect, useState, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, Step } from "react-joyride";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { isDemoMode } from "@/lib/auth";

const DEMO_TOUR_STEP_KEY = "demoTourStep";
const DEMO_TOUR_DONE_KEY = "demoTourCompleted";

function getMenuButton() {
  return document.querySelector<HTMLElement>('[data-tour="server-menu-button"]');
}

function highlightMenuButton(color: string) {
  const btn = getMenuButton();
  if (!btn) return;
  btn.style.outline = `2px solid ${color}`;
  btn.style.outlineOffset = "3px";
  btn.style.borderRadius = "6px";
}

function clearMenuButtonHighlight() {
  const btn = getMenuButton();
  if (!btn) return;
  btn.style.outline = "";
  btn.style.outlineOffset = "";
  btn.style.borderRadius = "";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function DemoTour() {
  const { t } = useTranslation("demo");
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [tourState, setTourState] = useState<{ run: boolean; phase: 1 | 2 | null }>({
    run: false,
    phase: null,
  });

  const isOnHome = pathname === "/home";
  const isOnChannel = /^\/servers\/[^/]+\/channels\/[^/]+/.test(pathname ?? "");

  useEffect(() => {
    if (!isDemoMode()) return;
    if (localStorage.getItem(DEMO_TOUR_DONE_KEY) === "true") return;

    const storedStep = parseInt(localStorage.getItem(DEMO_TOUR_STEP_KEY) ?? "0", 10);

    let phase: 1 | 2 | null = null;
    if (isOnHome && storedStep < 2) phase = 1;
    else if (isOnChannel && storedStep >= 2) phase = 2;

    if (!phase) return;

    const resolvedPhase = phase;
    const timer = setTimeout(
      () => setTourState({ run: true, phase: resolvedPhase }),
      600
    );
    return () => clearTimeout(timer);
  }, [isOnHome, isOnChannel]);

  // Phase 1: /home — welcome + friends sidebar + home nav tabs + server sidebar
  const phase1Steps: Step[] = [
    {
      target: "body",
      title: t("welcome.author"),
      content: t("welcome.body"),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="friends-sidebar"]',
      title: t("phase1.step0.title"),
      content: t("phase1.step0.content"),
      placement: "right",
      disableBeacon: true,
    },
    {
      target: '[data-tour="home-nav"]',
      title: t("phase1.step2.title"),
      content: t("phase1.step2.content"),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: '[data-tour="server-sidebar"]',
      title: t("phase1.step1.title"),
      content: t("phase1.step1.content"),
      placement: "right",
      disableBeacon: true,
    },
  ];

  // Phase 1 mobile: only target visible elements
  const phase1MobileSteps: Step[] = [
    {
      target: "body",
      title: t("welcome.author"),
      content: t("welcome.body"),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: "body",
      title: t("mobile.phase1.step0.title"),
      content: t("mobile.phase1.step0.content"),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="home-nav-mobile"]',
      title: t("mobile.phase1.step1.title"),
      content: t("mobile.phase1.step1.content"),
      placement: "bottom",
      disableBeacon: true,
    },
  ];

  // Phase 2: /servers/.../channels/... — channel sidebar + chat input + profile bar
  const phase2Steps: Step[] = [
    {
      target: '[data-tour="channel-sidebar"]',
      title: t("phase2.step0.title"),
      content: t("phase2.step0.content"),
      placement: "right",
      disableBeacon: true,
    },
    {
      target: '[data-tour="chat-input"]',
      title: t("phase2.step1.title"),
      content: t("phase2.step1.content"),
      placement: "top",
      disableBeacon: true,
    },
    {
      target: '[data-tour="user-profile-bar"]',
      title: t("phase2.step2.title"),
      content: t("phase2.step2.content"),
      placement: "top",
      disableBeacon: true,
    },
  ];

  // Phase 2 mobile: only target visible elements
  const phase2MobileSteps: Step[] = [
    {
      target: "body",
      title: t("mobile.phase2.step0.title"),
      content: t("mobile.phase2.step0.content"),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="chat-input"]',
      title: t("phase2.step1.title"),
      content: t("phase2.step1.content"),
      placement: "top",
      disableBeacon: true,
    },
  ];

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index } = data;

      if (tourState.phase === 2 && !isMobile) {
        const primaryColor =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-gold")
            .trim() || "#c9a84c";

        // Add gold border to server menu button while channel-sidebar step is showing
        if (type === EVENTS.TOOLTIP && index === 0) {
          highlightMenuButton(primaryColor);
        }

        // Remove it as soon as the user advances past the channel-sidebar step
        if (type === EVENTS.STEP_AFTER && index === 0) {
          clearMenuButtonHighlight();
        }
      }

      // Auto-focus the chat input when its tooltip appears
      // On desktop: step index 1; on mobile: step index 1
      if (tourState.phase === 2 && type === EVENTS.TOOLTIP && index === 1) {
        const input = document.querySelector<HTMLInputElement>(
          '[data-tour="chat-input"]'
        );
        input?.focus();
      }

      if (status === STATUS.FINISHED) {
        clearMenuButtonHighlight();
        setTourState((prev) => ({ ...prev, run: false }));
        if (tourState.phase === 1) {
          localStorage.setItem(DEMO_TOUR_STEP_KEY, "2");
        } else {
          localStorage.setItem(DEMO_TOUR_DONE_KEY, "true");
        }
      }

      if (status === STATUS.SKIPPED) {
        clearMenuButtonHighlight();
        setTourState((prev) => ({ ...prev, run: false }));
        localStorage.setItem(DEMO_TOUR_DONE_KEY, "true");
      }
    },
    [tourState.phase, isMobile]
  );

  const primaryColor =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement)
          .getPropertyValue("--color-gold")
          .trim() || "#c9a84c"
      : "#c9a84c";

  const bgColor =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement)
          .getPropertyValue("--color-surface")
          .trim() || "#1e1f22"
      : "#1e1f22";

  if (!tourState.run || tourState.phase === null) return null;

  const steps =
    tourState.phase === 1
      ? isMobile ? phase1MobileSteps : phase1Steps
      : isMobile ? phase2MobileSteps : phase2Steps;

  return (
    <Joyride
      steps={steps}
      run={tourState.run}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      callback={handleCallback}
      locale={{
        back: t("nav.back"),
        close: t("nav.close"),
        last: t("nav.last"),
        next: t("nav.next"),
        skip: t("nav.skip"),
      }}
      styles={{
        options: {
          primaryColor,
          backgroundColor: bgColor,
          textColor: "#ffffff",
          arrowColor: bgColor,
          overlayColor: "rgba(0, 0, 0, 0.55)",
          zIndex: 9999,
        },
        tooltip: {
          borderRadius: "8px",
          padding: "16px",
        },
        tooltipTitle: {
          color: primaryColor,
          fontWeight: 600,
          fontSize: "14px",
          marginBottom: "6px",
        },
      }}
    />
  );
}
