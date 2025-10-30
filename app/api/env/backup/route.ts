import 'server-only';
import { NextRequest } from 'next/server';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';


// Usa credenciales del **Core** configuradas en el entorno del servidor (no en el módulo)
// Variables típicas: CORE_FIREBASE_PROJECT_ID, CORE_FIREBASE_CLIENT_EMAIL, CORE_FIREBASE_PRIVATE_KEY
if (!getApps().length) {
    try {
        initializeApp({ credential: applicationDefault() });
    } catch {
        initializeApp({
            credential: cert({
                projectId: process.env.CORE_FIREBASE_PROJECT_ID!,
                clientEmail: process.env.CORE_FIREBASE_CLIENT_EMAIL!,
                privateKey: process.env.CORE_FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
            }),
        });
    }
}

export async function POST(req: NextRequest) {
    const { tenant, env, versionTs } = await req.json();
    if (!tenant || !env) return new Response('tenant/env required', { status: 400 });
    const ts = typeof versionTs === 'number' ? versionTs : Date.now();

    const db = getFirestore();
    // Estructura write-only, append-only
    const ref = db.doc(`env_backups/${tenant}/${ts}`);
    await ref.set({ tenant, env, ts, createdAt: ts }, { merge: false });

    return Response.json({ ok: true, ts });
}