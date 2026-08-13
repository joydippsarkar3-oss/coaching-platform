"use client";

import { useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISIT_COUNT_KEY = "pwa_visit_count";
const DISMISSED_KEY = "pwa_dismissed";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    navigator.userAgent.includes("iPhone") ||
    navigator.userAgent.includes("iPad")
  );
}

export function PWAInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // Never show if user already permanently dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    // Track visit count
    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));

    if (isIOS()) {
      // Show iOS "Add to Home Screen" tip from the 2nd visit onward
      if (count >= 2) setIosHint(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      if (count >= 2) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      // Analytics hook
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "pwa_install", {
          event_category: "PWA",
          event_label: "accepted",
        });
      }
      deferredPrompt.current = null;
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    setIosHint(false);
  };

  if (iosHint) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <p className="text-sm text-gray-700">
          Tap <span className="font-semibold">Share</span> then{" "}
          <span className="font-semibold">Add to Home Screen</span> for faster
          access — works offline too!
        </p>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
          aria-label="Dismiss install hint"
        >
          ✕
        </button>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
      <p className="text-sm text-gray-700">
        Install our app for faster access — works offline too!
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleInstall}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-xs text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Not now"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
