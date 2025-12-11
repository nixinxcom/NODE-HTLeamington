'use client';

import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase';
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
import { useRouter } from "next/navigation";

type PaymentDoc = {
  id: string;
  orderId: string;
  tenantId: string;
  amount: string;
  currency: string;
  status: string;
  payerEmail?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

export default function PaymentsAdminPage() {
  const router = useRouter();
  
  const [payments, setPayments] = useState<PaymentDoc[]>([]);

  useEffect(() => {
    const q = query(
      collection(FbDB, 'Payments'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data: PaymentDoc[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as any;
        data.push({
          id: docSnap.id,
          orderId: d.orderId,
          tenantId: d.tenantId,
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

  return (
    <main className="p-6">
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
      <h1 className="text-xl font-semibold mb-4">
        Pagos PayPal
      </h1>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 pr-2">Fecha</th>
            <th className="text-left py-2 pr-2">Tenant</th>
            <th className="text-left py-2 pr-2">Orden</th>
            <th className="text-left py-2 pr-2">Monto</th>
            <th className="text-left py-2 pr-2">Estatus</th>
            <th className="text-left py-2 pr-2">Email pagador</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-gray-800">
              <td className="py-1 pr-2">
                {p.createdAt?.toDate
                  ? p.createdAt.toDate().toLocaleString()
                  : '—'}
              </td>
              <td className="py-1 pr-2">{p.tenantId}</td>
              <td className="py-1 pr-2">{p.orderId}</td>
              <td className="py-1 pr-2">
                {p.amount} {p.currency}
              </td>
              <td className="py-1 pr-2">{p.status}</td>
              <td className="py-1 pr-2">{p.payerEmail ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
