'use client'

import React from 'react'
import { useAuth } from '@/complements/components/AuthenticationComp/AuthContext';
import styles from "./UserBadge.module.css";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

// Genera un color basado en el email
function circleColor(email?: string | null) {
  if (!email) return 'bg-white/20'
  const h = email
    .split('')
    .reduce((a, c) => (a + c.charCodeAt(0)) % 360, 0)
  return `bg-[hsl(${h}deg_70%_45%/0.85)]`
}

export default function UserBadge({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()

  const email = user?.email ?? ''
  const name = user?.displayName ?? ''
  const initial = (name || email || '?').slice(0, 1).toUpperCase()
  const authed = !!user

  return (
    <div
      className={`${styles.wrap} ${compact ? styles.textSm : styles.textXs}`}
      title={authed ? (email || name || 'sesión activa') : 'no autenticado'}
    >
      <div
        className={`${styles.avatar} ${circleColor(email)}`}
      >
        {initial}
      </div>
      <SPAN className={styles.name}>
        {authed ? email || name || 'usuario' : 'no auth'}
      </SPAN>
      <SPAN
        className={`${styles.dot} ${authed ? styles.dotOn : styles.dotOff}`}
        aria-hidden
      />
    </div>
  )
}
