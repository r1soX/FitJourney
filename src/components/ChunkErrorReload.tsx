"use client";

import { useEffect } from "react";

// После деплоя старые JS-чанки могут исчезнуть (новые хеши). Если клиент с
// открытой старой страницей пытается их подгрузить — ловим ошибку и один раз
// перезагружаем страницу, чтобы получить свежую версию.
const KEY = "fj_chunk_reload";

export function ChunkErrorReload() {
  useEffect(() => {
    // если недавно перезагружались из-за чанка — снимаем флаг после успешной загрузки
    const t = setTimeout(() => {
      try {
        sessionStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
    }, 5000);

    const isChunkError = (msg: string) =>
      /ChunkLoadError|Loading chunk [\w-]+ failed|Importing a module script failed|error loading dynamically imported module/i.test(
        msg,
      );

    const handler = (e: ErrorEvent | PromiseRejectionEvent) => {
      const reason =
        (e as PromiseRejectionEvent).reason ?? (e as ErrorEvent).error ?? (e as ErrorEvent).message;
      const msg = typeof reason === "string" ? reason : reason?.message || "";
      if (!isChunkError(msg)) return;
      try {
        if (sessionStorage.getItem(KEY)) return; // уже пробовали — не зациклимся
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
      window.location.reload();
    };

    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", handler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", handler);
    };
  }, []);

  return null;
}
