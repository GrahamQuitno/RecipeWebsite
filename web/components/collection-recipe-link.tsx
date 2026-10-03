"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

export const RECIPE_LIST_SCROLL_KEY = "recipe-list-scroll-y";

interface CollectionRecipeLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

export function CollectionRecipeLink({ href, className, children }: CollectionRecipeLinkProps) {
  function rememberScrollPosition(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    try {
      window.sessionStorage.setItem(RECIPE_LIST_SCROLL_KEY, String(window.scrollY));
    } catch {
      // Search state is still preserved in the URL when browser storage is unavailable.
    }
  }

  return (
    <Link className={className} href={href} onClick={rememberScrollPosition}>
      {children}
    </Link>
  );
}
