// app/[locale]/(sites)/pageFunctions.tsx
// Autohide con soporte de contenedores de scroll (window o elemento)
// API: initNavAutoHide({ selector, container?, ...opts })

export type NavAutoHideOptions = {
  selector: string;                         // ej. '#site-navbar'
  container?: Window | HTMLElement | string; // window (default), un elemento o un selector CSS (ej. 'main', '#scrollArea')
  hiddenClass?: string;                     // ej. styles.hidden (si lo pasas, togglean la clase)
  downThreshold?: number;                   // px acumulados para ocultar al bajar
  upThreshold?: number;                     // px acumulados para mostrar al subir
  topSafeZone?: number;                     // px cerca del top donde no se oculta
  lock?: () => boolean;                     // si true, bloquea (menú abierto)
  onChange?: (hidden: boolean) => void;     // notifica a React
  debug?: boolean;
};

type ScrollTarget = Window | HTMLElement;

function resolveContainer(opt?: Window | HTMLElement | string): ScrollTarget {
  if (!opt) return window;
  if (opt === window) return window;
  if (typeof opt === 'string') {
    const el = document.querySelector(opt);
    if (el instanceof HTMLElement) return el;
    return window;
  }
  if (opt instanceof HTMLElement) return opt;
  return window;
}

// Heurística para auto-detectar el scroller principal si te interesa usarla en el futuro
function autoDetectScroller(): ScrollTarget {
  // Prioriza un <main> que realmente scrollee
  const candidates: (Element | null)[] = [
    document.querySelector('main'),
    document.getElementById('__next'),
    document.body,
    document.documentElement,
  ];
  for (const c of candidates) {
    if (!(c instanceof HTMLElement)) continue;
    const cs = getComputedStyle(c);
    const overY = cs.overflowY;
    if ((overY === 'auto' || overY === 'scroll') && c.scrollHeight > c.clientHeight) return c;
  }
  return window;
}

export function initNavAutoHide(opts: NavAutoHideOptions) {
  const {
    selector,
    container, // opcional
    hiddenClass = 'hidden',
    downThreshold = 10,
    upThreshold = 4,
    topSafeZone = 0,
    lock,
    onChange,
    debug = false,
  } = opts;

  const header = document.querySelector<HTMLElement>(selector);
  if (!header) {
    if (debug) console.warn(`[nav] Header no encontrado para selector='${selector}'`);
    return () => {};
  }

  // Si no te pasan container, usa window. (Puedes cambiar a autoDetectScroller() si prefieres)
  const target: ScrollTarget = container ? resolveContainer(container) : window;

  const getY = () => (target === window ? window.scrollY : (target as HTMLElement).scrollTop);

  let lastY = getY();
  let accDown = 0;
  let accUp = 0;
  let hidden = false;
  let ticking = false;

  const applyHidden = (v: boolean) => {
    if (hidden === v) return;
    hidden = v;
    if (hiddenClass) header.classList.toggle(hiddenClass, hidden);
    onChange?.(hidden);
    // if (debug) console.log(`[nav] ${hidden ? 'hide →' : 'show ←'}`, { y: getY() });
  };

  const onScroll = () => {
    if (lock?.()) return;

    const currentY = getY();
    if (!ticking) {
      requestAnimationFrame(() => {
        const delta = currentY - lastY;

        if (Math.abs(delta) < 2) { lastY = currentY; ticking = false; return; }

        if (currentY <= topSafeZone) {
          accDown = 0; accUp = 0;
          applyHidden(false);
        } else if (delta > 0) {
          accDown += delta; accUp = 0;
          if (!hidden && accDown >= downThreshold) { applyHidden(true); accDown = 0; }
        } else {
          accUp += Math.abs(delta); accDown = 0;
          if (hidden && accUp >= upThreshold) { applyHidden(false); accUp = 0; }
        }

        if (debug) {
          const dir = delta > 0 ? 'down' : 'up';
          //console.log('[nav] scroll', { lastY, currentY, delta, dir, hidden, accDown, accUp, target: target === window ? 'window' : 'element' });
        }
        lastY = currentY; ticking = false;
      });
      ticking = true;
    }
  };

  // Listener de scroll en el target correcto
  if (target === window) {
    window.addEventListener('scroll', onScroll, { passive: true });
  } else {
    (target as HTMLElement).addEventListener('scroll', onScroll, { passive: true });
  }

  const sync = () => { lastY = getY(); };

  window.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', sync);

  // Log inicial para confirmar que sí se montó
  if (debug) {
    // console.log('[nav] init', {
    //   headerFound: !!header,
    //   container: target === window ? 'window' : (target as HTMLElement).tagName.toLowerCase() + ( (target as HTMLElement).id ? `#${(target as HTMLElement).id}` : '' )
    // });
  }

  return () => {
    if (target === window) {
      window.removeEventListener('scroll', onScroll);
    } else {
      (target as HTMLElement).removeEventListener('scroll', onScroll);
    }
    window.removeEventListener('visibilitychange', sync);
    window.removeEventListener('resize', sync);
  };
}
