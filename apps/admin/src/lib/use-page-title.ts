import { useEffect } from 'react';

const BRAND = 'Tiglemp Admin';

/**
 * Sets `document.title` to "<title> — Tiglemp Admin" while the component is
 * mounted. Restores the previous title on unmount so route changes don't
 * leak stale titles when navigation is interrupted.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${BRAND}` : BRAND;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
