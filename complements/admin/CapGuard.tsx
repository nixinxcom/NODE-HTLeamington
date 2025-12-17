'use client';

import React from 'react';
import { useCct } from '@/app/providers/CctClientProvider';

export default function CapGuard({
  cap,
  children,
  fallback = null,
  loadingFallback = null,
}: {
  cap: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}) {
  const { loading, hasCap } = useCct();

  if (loading) return <>{loadingFallback}</>;
  if (!hasCap(cap)) return <>{fallback}</>;

  return <>{children}</>;
}
