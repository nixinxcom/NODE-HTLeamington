'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { FbStorage } from '@/app/lib/services/firebase';

/**
 * Convierte una ruta de Storage (ej: "services/media/abc.png") en una URL pública.
 * Si ya es http/https (o data:), la regresa tal cual.
 */

const cache = new Map<string, string>();

const isProbablyUrl = (v: string) =>
  /^(https?:\/\/|data:)/i.test(v);

export function useStorageUrl(storagePath?: string | null) {
  const key = (storagePath ?? '').trim();

  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => {
    if (!key) return '';
    return key.replace(/^\//, '');
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    if (!normalized) {
      setUrl('');
      return;
    }

    if (isProbablyUrl(normalized)) {
      setUrl(normalized);
      return;
    }

    const cached = cache.get(normalized);
    if (cached) {
      setUrl(cached);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const u = await getDownloadURL(ref(FbStorage, normalized));
        cache.set(normalized, u);
        if (!cancelled) setUrl(u);
      } catch (e) {
        console.error('[useStorageUrl] Error resolviendo URL', e);
        if (!cancelled) {
          setError('No se pudo resolver la URL del recurso.');
          setUrl('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalized]);

  return { url, loading, error };
}
