import React, { useEffect } from "react";
import styles from "./Popup.module.css";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface iPopup{
  Message: string;
}
function FeedbackPopup (props: iPopup){
  return (
    <div className={styles.Popup}>
      <P>{props.Message}</P>
    </div>
  )
}

export default React.memo(FeedbackPopup)

/* ─────────────────────────────────────────────────────────
DOC: Popup — complements/components/Popup/Popup.tsx
QUÉ HACE:
  Componente de ventana emergente ligera (no portal) controlada por prop `open` y callback `onClose`.

API / EXPORTS / RUTA:
  — export interface PopupProps { open: boolean; onClose: ()=>void; title?: string; className?: string; children?: React.ReactNode }
  — export default function Popup(p:PopupProps): JSX.Element

USO (ejemplo completo):
  <Popup open={isOpen} onClose={()=>setOpen(false)} title="Aviso">Contenido</Popup>

NOTAS CLAVE:
  — Accesibilidad: focus trap, cierre con Esc; aria-modal si es modal real.
  — Considera usar Portal (ver PopupComp) para sobreponer sobre todo.

DEPENDENCIAS:
  React
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/Popup/Popup.tsx
  "use client";
  import { useState } from "react";
  import Popup from "@/complements/components/Popup/Popup";

  export default function SimplePopup() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <BUTTON onClick={()=>setOpen(true)}>Abrir</BUTTON>
        <Popup
          open={open}                    // boolean | requerido
          onClose={()=>setOpen(false)}   // ()=>void | requerido
          title="Aviso importante"       // string | opcional
          className="max-w-lg"
        >
          <P>Contenido del popup…</P>
        </Popup>
      </>
    );
  }
────────────────────────────────────────────────────────── */
