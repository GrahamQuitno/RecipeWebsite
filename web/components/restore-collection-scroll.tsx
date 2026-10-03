"use client";

import { useEffect } from "react";
import { RECIPE_LIST_SCROLL_KEY } from "@/components/collection-recipe-link";

interface RestoreCollectionScrollProps {
  shouldRestore: boolean;
}

export function RestoreCollectionScroll({ shouldRestore }: RestoreCollectionScrollProps) {
  useEffect(() => {
    if (!shouldRestore) return;

    try {
      const savedPosition = window.sessionStorage.getItem(RECIPE_LIST_SCROLL_KEY);
      const scrollY = savedPosition === null ? Number.NaN : Number(savedPosition);

      if (Number.isFinite(scrollY) && scrollY >= 0) {
        window.sessionStorage.removeItem(RECIPE_LIST_SCROLL_KEY);
        window.requestAnimationFrame(() => window.scrollTo(0, scrollY));
      }
    } catch {
      // The collection remains usable if browser storage is unavailable.
    }
  }, [shouldRestore]);

  return null;
}
