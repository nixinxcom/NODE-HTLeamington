'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import styles from './HoldComp.module.css';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface HoldProps {
  centralImg: string;
  rotatingImg: string;
  successImg?: string; // opcional: para <Success />
  failedImg?: string;  // opcional: para <Failed />
  width: number;
  height: number;
  altCentral?: string;
  altRotating?: string;
}

const HoldComp = memo(function HoldComp(props: HoldProps) {
  const { centralImg, rotatingImg, width, height, altCentral, altRotating } = props;

  return (
    <div className={styles.modalOverlay} role="status" aria-live="polite" aria-label="Loading">
      {/* contenedor apilado para centrar y superponer */}
      <div className={styles.stack} style={{ width: width * 1.4, height: height * 1.4 }}>
        {/* Círculo/engranaje rotando (ocupa todo el contenedor) */}
        <Image
          src={rotatingImg}
          alt={altRotating ?? 'Loading'}
          fill
          className={styles.RotationImg}
          priority
        />
        {/* Ícono central */}
        <Image
          src={centralImg}
          alt={altCentral ?? 'Logo'}
          width={width}
          height={height}
          className={styles.CentralImg}
          priority
        />
      </div>
    </div>
  );
});

interface ResultProps {
  message?: string;
  img?: string;
  width?: number;
  height?: number;
}

const Success = memo(function Success({ message = 'Success', img, width = 120, height = 120 }: ResultProps) {
  return (
    <div className={styles.modalOverlaySuccess} role="alert" aria-live="assertive">
      {img ? <Image src={img} alt="Success" width={width} height={height} /> : message}
    </div>
  );
});

const Failed = memo(function Failed({ message = 'Error', img, width = 120, height = 120 }: ResultProps) {
  return (
    <div className={styles.modalOverlayFail} role="alert" aria-live="assertive">
      {img ? <Image src={img} alt="Error" width={width} height={height} /> : message}
    </div>
  );
});

export { HoldComp, Success, Failed };
// ejemplo de uso:
// <HoldComp centralImg="/logo.png" rotatingImg="/gear.png" width={100} height={100} />
// <Success message="¡Éxito!" img="/success.png" width={100}    height={100} />
// <Failed  message="¡Error!"  img="/error.png"   width={100} height={100} />

/* ─────────────────────────────────────────────────────────
DOC: HoldComp — complements/components/HoldComp/HoldComp.tsx
QUÉ HACE:
  Wrapper de “bloqueo/espera” que cubre su contenido con un overlay de loading o un mensaje
  mientras se realiza una operación asíncrona.

API / EXPORTS / RUTA:
  — export interface HoldProps {
      hold: boolean;                    // activar overlay
      text?: string;                    // mensaje opcional
      spinner?: React.ReactNode;        // spinner custom
      className?: string; children: React.ReactNode
    }
  — export default function HoldComp(p:HoldProps): JSX.Element

USO (ejemplo completo):
  <HoldComp hold={loading} text="Procesando..."><Checkout/></HoldComp>

NOTAS CLAVE:
  — Accesibilidad: aria-busy y aria-live para mensajes.
  — Evitar bloquear interacción esencial más de lo necesario.

DEPENDENCIAS:
  React
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/HoldComp/HoldComp.tsx
  "use client";
  import HoldComp from "@/complements/components/HoldComp/HoldComp";

  export default function SaveAction({ loading }: { loading: boolean }) {
    return (
      <HoldComp
        hold={loading}                 // boolean | requerido
        text="Procesando..."           // string | opcional
        className="relative"
      >
        <BUTTON className="btn">Guardar cambios</BUTTON>
      </HoldComp>
    );
  }
────────────────────────────────────────────────────────── */
