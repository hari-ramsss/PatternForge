'use client';

import { useEffect } from 'react';

/**
 * Site-wide pointer-down "click" cursor swap.
 *
 * The /workspace screen already swaps to /default-click.png while a
 * pointer is held down anywhere inside it. This mounts the same effect
 * once at the app root (see Providers) so every route gets it — toggling
 * a class on <html> instead of a page-local wrapper, so it works no
 * matter which page is active or whether the target is a portal/modal
 * rendered outside the normal component tree.
 *
 * Pairs with the "GLOBAL CURSOR SYSTEM" block in globals.css, which reads
 * the `pf-clicking` class straight off <html>.
 */
export default function GlobalCursorEffects() {
  useEffect(() => {
    const root = document.documentElement;

    const down = () => root.classList.add('pf-clicking');
    const up = () => root.classList.remove('pf-clicking');

    // Capture phase so this fires even if a child stops propagation.
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    window.addEventListener('blur', up);

    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
      window.removeEventListener('blur', up);
      root.classList.remove('pf-clicking');
    };
  }, []);

  return null;
}
