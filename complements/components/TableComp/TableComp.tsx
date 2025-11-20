'use client'
import React from 'react';
import styles from './TableComp.module.css'; // Asegúrate de importar correctamente los estilos
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface DataRow {
  [key: string]: any;
}

interface DataTableProps {
  data: DataRow[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div>
        <FM id="table.nodata" defaultMessage="No data available" />
      </div>
    );
  }

  const headers = Object.keys(data[0]);

  return (
    <div className={styles.TableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header) => (
                <td key={header}>
                  {/* Verifica si el valor es un objeto */}
                  {typeof row[header] === 'object' && !Array.isArray(row[header]) ? (
                    <ul>
                      {/* Mapea las claves y valores del objeto */}
                      {Object.entries(row[header]).map(([key, value]) => (
                        <li key={key}>
                          {key}: {typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // Si no es un objeto, renderiza el valor normalmente
                    typeof row[header] === 'string' || typeof row[header] === 'number'
                      ? row[header]
                      : JSON.stringify(row[header]) // Convierte a string los valores que no sean de tipo renderizable.
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

/* ─────────────────────────────────────────────────────────
DOC: TableComp — complements/components/TableComp/TableComp.tsx
QUÉ HACE:
  Tabla reutilizable con definición de columnas, render de celdas, sort opcional y paginación simple.

API / EXPORTS / RUTA:
  — export interface Column<T=any> { key: keyof T | string; header: string; width?: number|string; render?: (row:T)=>React.ReactNode; sortable?: boolean }
  — export interface TableProps<T=any> { columns: Column<T>[]; data: T[]; keyField?: keyof T | string; pageSize?: number; className?: string; emptyText?: string }
  — export default function TableComp<T>(p:TableProps<T>): JSX.Element

USO (ejemplo completo):
  <TableComp
    columns={[{key:"title",header:"Título"},{key:"date",header:"Fecha"}]}
    data={[{title:"Show",date:"2025-09-01"}]}
    pageSize={20}
  />

NOTAS CLAVE:
  — Accesibilidad: <table> semántica, scope en <th>, captions si aplica.
  — Rendimiento: virtualizar si hay muchas filas; keys estables (keyField).

DEPENDENCIAS:
  React
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/TableComp/TableComp.tsx
  import TableComp from "@/complements/components/TableComp/TableComp";

  type Row = { title:string; date:string; price:number };

  export default function EventsTable() {
    const data: Row[] = [
      { title:"Show Latino", date:"2025-09-01", price:1500 },
      { title:"DJ Night", date:"2025-09-07", price:1200 }
    ];

    return (
      <TableComp<Row>
        columns={[
          { key:"title", header:"Título", sortable:true },                           // Column<Row>
          { key:"date",  header:"Fecha" },
          { key:"price", header:"Precio", render:(r)=>`$${(r.price/100).toFixed(2)}` }
        ]}
        data={data}                       // Row[] | requerido
        keyField="title"                  // keyof Row | string | opcional
        pageSize={20}                     // number | opcional
        className="min-w-full"
        emptyText="Sin registros"         // string | opcional
      />
    );
  }
────────────────────────────────────────────────────────── */
