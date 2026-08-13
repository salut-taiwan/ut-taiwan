import { useEffect } from 'react';

/**
 * Close an overlay when Escape is pressed.
 *
 * Every modal here could be dismissed by clicking its backdrop, which is
 * mouse-only — a keyboard user who opened one had no way to close it without
 * tabbing to find the cancel button. Escape is the expected key and costs one
 * line per overlay.
 *
 * No-ops while `active` is false, so the listener only exists while something
 * is actually open.
 */
export function useDismissOnEscape(active: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, onDismiss]);
}
