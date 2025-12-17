'use client';

import React from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase';
import { useRouter } from "next/navigation";
import {
  DIV,
  H1,
  H2,
  P,
  SPAN,
  BUTTON,
  TABLE,
  THEAD,
  TBODY,
  TR,
  TH,
  TD,
  INPUT,
  SELECT,
} from "@/complements/components/ui/wrappers";
import { AdminGuard } from '@/index';
import { CapGuard } from '@/complements/admin/CapGuard';

type PaymentDoc = {
  id: string;
  orderId: string;
  tenantId: string;
  concept?: string | null;
  amount: string;
  currency: string;
  status: string;
  payerEmail?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

type SortField = 'createdAt' | 'amount' | 'tenantId' | 'status';
type SortDir = 'asc' | 'desc';

export default function PaymentsAdmin() {
  const router = useRouter();
  const [payments, setPayments] = React.useState<PaymentDoc[]>([]);

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<'all' | 'created' | 'captured' | 'failed'>('all');
  const [sortField, setSortField] =
    React.useState<SortField>('createdAt');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  // Suscripción a Firestore
  React.useEffect(() => {
    const q = query(
      collection(FbDB, 'Payments'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data: PaymentDoc[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as any;
        data.push({
          id: docSnap.id,
          orderId: d.orderId,
          tenantId: d.tenantId,
          concept: d.concept ?? d.metadata?.concept ?? null,
          amount: d.amount,
          currency: d.currency,
          status: d.status,
          payerEmail: d.payerEmail ?? null,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        });
      });
      setPayments(data);
    });

    return () => unsub();
  }, []);

  // Búsqueda + filtros + sort en memoria
  const viewPayments = React.useMemo(() => {
    let data = [...payments];

    const q = search.trim().toLowerCase();

    if (q) {
      data = data.filter((p) => {
        const concept = (p.concept ?? '').toLowerCase();
        return (
          p.orderId.toLowerCase().includes(q) ||
          p.tenantId.toLowerCase().includes(q) ||
          (p.payerEmail ?? '').toLowerCase().includes(q) ||
          concept.includes(q)
        );
      });
    }

    if (statusFilter !== 'all') {
      data = data.filter((p) => p.status === statusFilter);
    }

    data.sort((a, b) => {
      let cmp = 0;

      if (sortField === 'amount') {
        const av = parseFloat(a.amount) || 0;
        const bv = parseFloat(b.amount) || 0;
        cmp = av - bv;
      } else if (sortField === 'tenantId') {
        cmp = a.tenantId.localeCompare(b.tenantId);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else {
        // createdAt
        const ta = a.createdAt?.toDate
          ? a.createdAt.toDate().getTime()
          : 0;
        const tb = b.createdAt?.toDate
          ? b.createdAt.toDate().getTime()
          : 0;
        cmp = ta - tb;
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [payments, search, statusFilter, sortField, sortDir]);

  return (
    <CapGuard
      cap="CampaignsCenter"
      fallback={<DIV style={{ padding: 16 }}>No tienes contratado CampaignsCenter.</DIV>}
      loadingFallback={<DIV style={{ padding: 16 }}>Cargando licencias…</DIV>}
    >
      <AdminGuard>
          <DIV className="p-6 space-y-4">
              {/* Botones de navegación superior */}
              <DIV className="flex justify-between items-center mb-2">
                  <DIV className="flex gap-2">
                      <BUTTON
                      type="button"
                      onClick={() => router.push("../admin")}
                      >
                      Admin Panel
                      </BUTTON>
                      <BUTTON
                      type="button"
                      onClick={() => router.push("../../")}
                      >
                      Home
                      </BUTTON>
                  </DIV>
              </DIV>
          <h1 className="text-xl font-semibold">
              Pagos PayPal
          </h1>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
              <input
              type="text"
              placeholder="Buscar por orden, tenant, email o concepto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-2 py-1 rounded border border-gray-700 bg-black/40"
              />

              <select
              value={statusFilter}
              onChange={(e) =>
                  setStatusFilter(e.target.value as any)
              }
              className="px-2 py-1 rounded border border-gray-700 bg-black/40"
              >
              <option value="all">Todos los estatus</option>
              <option value="created">Solo creados</option>
              <option value="captured">Solo capturados</option>
              <option value="failed">Solo fallidos</option>
              </select>

              <select
              value={sortField}
              onChange={(e) =>
                  setSortField(e.target.value as SortField)
              }
              className="px-2 py-1 rounded border border-gray-700 bg-black/40"
              >
              <option value="createdAt">Ordenar por fecha</option>
              <option value="amount">Ordenar por monto</option>
              <option value="tenantId">Ordenar por tenant</option>
              <option value="status">Ordenar por estatus</option>
              </select>

              <button
              type="button"
              onClick={() =>
                  setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
              }
              className="px-2 py-1 rounded border border-gray-700 bg-black/40"
              >
              {sortDir === 'asc' ? 'Ascendente ↑' : 'Descendente ↓'}
              </button>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
              <thead>
                  <tr className="border-b border-gray-700">
                  <th className="text-left py-2 pr-2">Fecha</th>
                  <th className="text-left py-2 pr-2">Tenant</th>
                  <th className="text-left py-2 pr-2">Concepto</th>
                  <th className="text-left py-2 pr-2">Orden</th>
                  <th className="text-left py-2 pr-2">Monto</th>
                  <th className="text-left py-2 pr-2">Estatus</th>
                  <th className="text-left py-2 pr-2">Email pagador</th>
                  </tr>
              </thead>
              <tbody>
                  {viewPayments.map((p) => (
                  <tr
                      key={p.id}
                      className="border-b border-gray-800 hover:bg-white/5"
                  >
                      <td className="py-1 pr-2">
                      {p.createdAt?.toDate
                          ? p.createdAt
                              .toDate()
                              .toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-1 pr-2">{p.tenantId}</td>
                      <td className="py-1 pr-2">
                      {p.concept ?? '—'}
                      </td>
                      <td className="py-1 pr-2">{p.orderId}</td>
                      <td className="py-1 pr-2">
                      {p.amount} {p.currency}
                      </td>
                      <td className="py-1 pr-2">{p.status}</td>
                      <td className="py-1 pr-2">
                      {p.payerEmail ?? '—'}
                      </td>
                  </tr>
                  ))}

                  {viewPayments.length === 0 && (
                  <tr>
                      <td
                      colSpan={7}
                      className="py-4 text-center text-gray-400"
                      >
                      No hay pagos registrados todavía.
                      </td>
                  </tr>
                  )}
              </tbody>
              </table>
          </div>
          </DIV>
      </AdminGuard>
    </CapGuard>
  );
}
