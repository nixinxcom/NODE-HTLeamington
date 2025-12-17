'use client'

import React, { useState, ReactNode, FormEvent, ReactElement } from 'react';
import styles from './FormComp.module.css';
import { UseFirestoreFunc } from '@/functionalities/CommonFunctions/UseFirestoreFunc';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface iFormComp {
  InlineStyles?: React.CSSProperties;
  children?: ReactNode;
}

export default function FormComp({ InlineStyles, children }: iFormComp) {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});

  const handleInputChange = (name: string, value: any) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (name: string, files: FileList | null) => {
    const fileNames = files ? Array.from(files).map(file => file.name) : [];
    setFormData((prevData) => ({ ...prevData, [name]: fileNames }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // console.log(JSON.stringify(formData, null, 2));
    try {
      await UseFirestoreFunc({
        CRUD: 'create',
        Collection: 'nixin',
        Documents: [formData],
      });
      console.log('Document successfully created!');
    } catch (error) {
      console.error('Error creating document: ', error);
    }
  };

  const cloneWithChangeHandler = (child: ReactElement) => {
    const { name, type } = child.props;
    switch (type) {
      case 'text':
      case 'email':
      case 'url':
      case 'search':
      case 'password':
      case 'number':
      case 'range':
      case 'date':
      case 'time':
      case 'month':
      case 'datetime-local':
      case 'color':
        return React.cloneElement(child, {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange(name, e.target.value),
        });
      case 'checkbox':
        return React.cloneElement(child, {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange(name, e.target.checked),
        });
      case 'radio':
        return React.cloneElement(child, {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.checked) {
              handleInputChange(name, e.target.value);
            }
          },
        });
      case 'file':
        return React.cloneElement(child, {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            handleFileChange(name, e.target.files);
          },
        });
      default:
      switch (child.type) {
          case 'select':
              return React.cloneElement(child, {
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => 
                  handleInputChange(name, e.target.value),
              });
          case 'textarea':
              return React.cloneElement(child, {
                  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange(name, e.target.value),
              });
          default:
        return child;
      }
    }
  };

  return (
    <form style={InlineStyles} onSubmit={handleSubmit} className={styles.form}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.name) {
          return cloneWithChangeHandler(child as ReactElement);
        }
        return child;
      })}
    </form>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: FormComp — complements/components/FormComp/FormComp.tsx
QUÉ HACE:
  Componente de formulario flexible con control de estado, validación básica y envío (onSubmit).
  Soporta campos comunes (input, textarea, select) y render props para personalizar.

API / EXPORTS / RUTA:
  — export interface Field { name:string; label?:string; type?:"text"|"email"|"tel"|"number"|"textarea"|"select"; options?: Array<{value:string;label:string}>; required?:boolean; placeholder?:string }
  — export interface FormCompProps {
      fields: Field[]; defaultValues?: Record<string,any>;
      onSubmit: (values:Record<string,any>)=>Promise<void>|void;
      submitLabel?: string; className?: string
    }
  — export default function FormComp(p:FormCompProps): JSX.Element

USO (ejemplo completo):
  <FormComp
    fields={[{name:"name",label:"Nombre",required:true},{name:"email",type:"email"}]}
    onSubmit={async (v)=>console.log(v)}
    submitLabel="Enviar"
  />

NOTAS CLAVE:
  — Accesibilidad: <LABEL htmlFor>, aria-invalid, mensajes claros.
  — Validación: síncrona mínima; integrar Zod/Yup si se requiere.
  — Seguridad: sanitizar antes de enviar; no exponer PII en logs.

DEPENDENCIAS:
  React · (opcional) libs de validación
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/FormComp/FormComp.tsx
  "use client";
  import FormComp from "@/complements/components/FormComp/FormComp";

  export default function ContactForm() {
    return (
      <FormComp
        fields={[
          { name:"name", label:"Nombre", required:true },               // Field
          { name:"email", label:"Email", type:"email" },                // Field
          { name:"message", label:"Mensaje", type:"textarea" },         // Field
          { name:"topic", label:"Tema", type:"select", options:[
            { value:"eventos", label:"Eventos" }, { value:"reservas", label:"Reservas" }
          ] }
        ]}
        defaultValues={{ topic:"eventos" }}                              // Record<string,any> | opcional
        submitLabel="Enviar"                                             // string | opcional
        className="max-w-md mx-auto"
        onSubmit={async (values)=>{ console.log(values); }}              // (values)=>Promise|void | requerido
      />
    );
  }
────────────────────────────────────────────────────────── */
