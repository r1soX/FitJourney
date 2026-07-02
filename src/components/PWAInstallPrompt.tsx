"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const DISMISS_KEY = "fj_install_dismissed";

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS не поддерживает beforeinstallprompt — показываем подсказку
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios/i.test(ua);
    if (isIos && isSafari) {
      setShowIos(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="glass-strong fixed inset-x-4 bottom-[calc(var(--nav-height)+var(--safe-bottom)+12px)] z-40 mx-auto max-w-md p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-accent-deep">
              <Download size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Установить FitJourney</div>
              {showIos ? (
                <p className="mt-0.5 text-xs text-white/55">
                  Нажми <Share size={12} className="inline" /> «Поделиться», затем «На экран
                  &laquo;Домой&raquo;».
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-white/55">
                  Добавь на экран «Домой» как приложение — быстрый доступ и офлайн-режим.
                </p>
              )}
              {!showIos && (
                <button onClick={install} className="btn-primary mt-3 h-10 w-full !py-0 text-sm">
                  Установить
                </button>
              )}
            </div>
            <button onClick={dismiss} className="text-white/40">
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
