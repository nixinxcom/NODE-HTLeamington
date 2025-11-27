'use client';

import { doc, setDoc } from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase';
import type iSettings from './interface';

const DOC_PATH = process.env.NEXT_PUBLIC_SETTINGS_DOC_PATH || 'Providers/Settings';

export async function saveSettingsClient(payload: Partial<iSettings>) {
  await setDoc(doc(FbDB, DOC_PATH), payload as iSettings, { merge: true });
}
