'use client'

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User } from 'firebase/auth'
import { FbAuth, GoogleProvider } from '@/app/lib/services/firebase'
import UserBadge from '@/complements/components/Auth/UserBadge'
import FM from '../i18n/FM'
import ThemeToggle from '../components/ThemeToggle/ThemeToggle'
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
/* ------------------------- Context para exponer user+token (ADITIVO: allowed/checking) ------------------------- */
interface AuthContextType {
  user: User | null
  idToken: string | null
  allowed?: boolean | null
  checking?: boolean
}
export const AuthContext = React.createContext<AuthContextType>({ user: null, idToken: null })
export function useAuth() { return React.useContext(AuthContext) }

/* -------- Anti-anidamiento: si ya hay un AdminGuard arriba, no duplica UI -------- */
const AdminGuardBoundary = createContext<boolean>(false)

type AdminGuardProps = {
  children: React.ReactNode
  agentId?: string
  showUserChip?: boolean
  title?: React.ReactNode
  subtitle?: React.ReactNode
}

export default function AdminGuard({
  children,
  agentId = 'default',
  showUserChip = false,
  title = <FM id="nav.admin" defaultMessage="Zona Administrativa" />,
  subtitle = <FM id="nav.restricted" defaultMessage="Acceso restringido" />,
}: AdminGuardProps) {
  const inside = useContext(AdminGuardBoundary)
  if (inside) return <>{children}</>

  return (
    <AdminGuardBoundary.Provider value={true}>
      <AdminGate agentId={agentId} showUserChip={showUserChip} title={title} subtitle={subtitle}>
        {children}
      </AdminGate>
    </AdminGuardBoundary.Provider>
  )
}

/* --------------------------------- Implementación --------------------------------- */
function AdminGate({
  children,
  agentId,
  showUserChip,
  title,
  subtitle,
}: Required<Omit<AdminGuardProps, 'children'>> & { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(FbAuth, async (firebaseUser) => {
      setLoading(true)
      try {
        if (firebaseUser) {
          setUser(firebaseUser)
          const token = await firebaseUser.getIdToken()
          setIdToken(token)
        } else {
          setUser(null)
          setIdToken(null)
          setAllowed(null)
        }
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let cancel = false
    async function check() {
      if (!user) return
      setChecking(true)
      setError(null)
      try {
        const token = await user.getIdToken()
        const resp = await fetch(`/api/admin/ai-agents/${agentId}?_=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (cancel) return
        setAllowed(resp.ok)
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '')
          setError(txt || 'Permisos insuficientes o token inválido.')
        }
      } catch (e: any) {
        // No intentamos fallback a hardcode desde el cliente (regla #43).
        setAllowed(false)
        setError('No fue posible validar permisos en servidor.')
      } finally {
        if (!cancel) setChecking(false)
      }
    }
    if (user) check()
    return () => { cancel = true }
  }, [user, agentId])

  const handleLogin = useCallback(async () => {
    try {
      await signInWithPopup(FbAuth, GoogleProvider)
      // No se sondea window.closed; el SDK maneja el popup.
    } catch (e: any) {
      // Fallback robusto sin warnings de COOP
      const code = e?.code as string | undefined
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/internal-error' ||
        e?.message?.includes('blocked by Content Security Policy')
      ) {
        await signInWithRedirect(FbAuth, GoogleProvider)
        return
      }
      console.error('Google sign-in error:', e)
    }
  }, [])

  async function handleLogout() {
    await signOut(FbAuth)
    setUser(null)
    setIdToken(null)
    setAllowed(null)
  }

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  )
  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-6 py-5 shadow-xl">
      {children}
    </div>
  )
  const TitleBlock = () => (
    <div className="mb-4">
      <H1 className="text-xl font-semibold tracking-tight">{title}</H1>
      <P className="text-sm text-white/60">{subtitle}</P>
    </div>
  )

  const Divider = () => <div className="my-4 h-px w-full bg-white/10" />
  const Chip = ({ text, showIcon = true }: { text: string; showIcon?: boolean }) => (
    <SPAN className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs">
      {showIcon && (
        <SPAN className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20">A</SPAN>
      )}
      <SPAN className="truncate max-w-[220px]">{text}</SPAN>
    </SPAN>
  )

  if (loading) {
    return (
      <Wrapper>
        <Card>
          <TitleBlock />
          <P className="text-sm text-white/70"><FM id="loadingSession" defaultMessage="Cargando sesión…" /></P>
        </Card>
      </Wrapper>
    )
  }

  if (!user) {
    return (
      <Wrapper>
        <Card>
          <TitleBlock />
          <div className="flex items-center gap-3">
            <BUTTON onClick={handleLogin}><FM id="loginWithGoogle" defaultMessage="Acceso de Controlador" /></BUTTON>
          </div>
          <Divider />
          <LINK href={"/"} className="rounded-full border border-white/20 p-3.5 text-xs text-white/70 hover:bg-white/30">
            <FM id="backtohome" defaultMessage="Pagina de Inicio" />
          </LINK>
          <Divider />
          <P className="text-xs text-white/50"><FM id="restrictedPanel" defaultMessage="Panel restringido a cuentas autorizadas." /></P>
        </Card>
      </Wrapper>
    )
  }

  if (checking || allowed === null) {
    return (
      <Wrapper>
        <Card>
          <TitleBlock />
          {showUserChip && <div className="mb-3"><Chip text={user.email ?? '—'} /></div>}
          <P className="text-sm text-white/70"><FM id="checkingPermissions" defaultMessage="Verificando permisos…" /></P>
          <Divider />
          <BUTTON variant="ghost" onClick={handleLogout}><FM id="logout" defaultMessage="Cerrar sesión" /></BUTTON>
        </Card>
      </Wrapper>
    )
  }

  if (!allowed) {
    return (
      <Wrapper>
        <Card>
          <TitleBlock />
          {showUserChip && <div className="mb-3"><Chip text={user.email ?? '—'} /></div>}
          <P className="text-sm text-red-300/90">No tienes permisos para ver este panel.</P>
          {error && <P className="mt-1 text-xs text-red-300/70">{error}</P>}
          <Divider />
          <BUTTON variant="ghost" onClick={handleLogout}>Cerrar sesión</BUTTON>
        </Card>
      </Wrapper>
    )
  }

  // Permitido → renderiza sección + barra superior
  return (
    <AuthContext.Provider value={{ user, idToken, allowed, checking }}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-3 border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <UserBadge compact />
        </div>
        <LINK href={"/"} className="bg-white text-black pr-2 pl-2 rounded-md">
          <FM id="nav.homeAlt" defaultMessage="Página de Inicio" />
        </LINK>
        <ThemeToggle />
        <LINK href={"/admin"} className="bg-white text-black pr-2 pl-2 rounded-md">
          <FM id="nav.panel" defaultMessage="Panel de Control" />
        </LINK>
        <BUTTON variant="ghost" onClick={handleLogout}>
          <FM id="logout" defaultMessage="Cerrar sesión" />
        </BUTTON>
      </div>
      {children}
    </AuthContext.Provider>
  )
}
