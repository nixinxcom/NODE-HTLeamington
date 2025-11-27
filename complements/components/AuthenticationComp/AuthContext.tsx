'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithRedirect,   // ⬅️ nuevo
  signOut,
  setPersistence,
  inMemoryPersistence,
  User,
} from 'firebase/auth';
import { FbAuth } from '@/app/lib/services/firebase';
import { useAppContext } from '@/context/AppContext';

type Role = 'anon' | 'user' | 'admin' | 'superadmin';

export type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  userRole: Role; // nunca null
  // acciones:
  signInAnon: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInFacebook: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInGoogleKiosk: () => Promise<void>;
  logoutKiosk: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function useAuthContext(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}

export const useAuth = useAuthContext;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuthenticated } = useAppContext();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role>('anon');

  useEffect(() => {
    const unsub = onAuthStateChanged(FbAuth, async (u) => {
      setUser(u);
      setAuthenticated(Boolean(u));
      setLoading(false);

      if (!u) {
        setUserRole('anon');
        return;
      }

      // Rol por defecto para autenticado hasta que server responda
      let role: Role = 'user';

      try {
        const token = await u.getIdToken();
        const resp = await fetch('/api/acl/role', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (resp.ok) {
          const data = (await resp.json()) as { role?: Role };
          if (data?.role === 'superadmin' || data?.role === 'admin' || data?.role === 'user') {
            role = data.role;
          }
        }
      } catch {
        // si la API no existe aún u offline: mantener 'user'
      }

      setUserRole(role);
    });

    return () => unsub();
  }, [setAuthenticated]);

  // Acciones
  const signInAnon = async () => {
    setLoading(true);
    await signInAnonymously(FbAuth);
  };

  const signInGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(FbAuth, provider);
    } catch (e: any) {
      const code = e?.code || '';
      // Usuario cerró el popup o se canceló: no hagas nada (evita errores en UI)
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // no-op
      }
      // Popup bloqueado o entorno no soporta popups → usa redirect
      else if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(FbAuth, provider);
        return; // dejamos que el redirect continúe el flujo
      } else {
        // Otros errores: deja un rastro en consola pero no rompas la UI
        console.error('Google sign-in error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInGoogleKiosk = async () => {
    setLoading(true);
    try {
      // Sesión efímera (no se guarda al recargar)
      await setPersistence(FbAuth, inMemoryPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' }); // siempre selector

      await signInWithPopup(FbAuth, provider);
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // no-op
      } else if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        // fallback a redirect si el popup no es posible
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithRedirect(FbAuth, provider);
        return;
      } else {
        console.error('Google kiosk sign-in error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const logoutKiosk = async () => {
    setLoading(true);
    try {
      await signOut(FbAuth);

      // Limpia rastros locales de Firebase en este origen
      try {
        const apiKey = (FbAuth.app.options as any)?.apiKey || '';
        localStorage.removeItem(`firebase:authUser:${apiKey}:[DEFAULT]`);
        localStorage.removeItem(`firebase:authEvent:${apiKey}:[DEFAULT]`);
        sessionStorage.removeItem(`firebase:authUser:${apiKey}:[DEFAULT]`);
        sessionStorage.removeItem(`firebase:authEvent:${apiKey}:[DEFAULT]`);
      } catch {}

      // Cierra sesión de Google en el navegador (iPad/safari)
      const returnUrl = window.location.origin + '/logout-complete';
      window.location.href =
        `https://accounts.google.com/Logout?continue=${encodeURIComponent(returnUrl)}`;
    } finally {
      setLoading(false);
    }
  };

  const signInFacebook = async () => {
    setLoading(true);
    const provider = new FacebookAuthProvider();
    provider.setCustomParameters({ display: 'popup' });
    try {
      await signInWithPopup(FbAuth, provider);
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // no-op
      } else if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(FbAuth, provider);
        return;
      } else {
        console.error('Facebook sign-in error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInEmail = async (email: string, password: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(FbAuth, email, password);
  };

  const signUpEmail = async (email: string, password: string) => {
    setLoading(true);
    const cred = await createUserWithEmailAndPassword(FbAuth, email, password);
    try { await sendEmailVerification(cred.user); } catch {}
  };

  const logout = async () => {
    setLoading(true);
    await signOut(FbAuth);
  };

  const isAnonymous = Boolean(user?.isAnonymous);

  const value: AuthCtx = useMemo(
    () => ({
      user,
      loading,
      isAnonymous,
      userRole,
      // actions
      signInAnon,
      signInGoogle,
      signInFacebook,
      signInEmail,
      signUpEmail,
      logout,
      signInGoogleKiosk,
      logoutKiosk,
    }),
    [user, loading, isAnonymous, userRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}