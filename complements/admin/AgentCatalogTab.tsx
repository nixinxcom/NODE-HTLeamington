'use client';
import React, { useEffect, useState } from 'react';
import { FbDB, FbStorage } from '@/app/lib/services/firebase';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import s from './admin.module.css';
import FM from '../i18n/FM';

const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || "default";

type Item = {
  id?: string;
  name: string;
  description?: string;
  price?: number;
  photoUrl?: string;   // URL pública o de Storage
  options?: string[];  // libre
  features?: string[]; // libre
  active?: boolean;
};

type Kind = 'products' | 'services';

export default function AgentCatalogTab() {
  const [kind, setKind] = useState<Kind>('products');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [uploading, setUploading] = useState(false);

  const collectionName = kind === 'products' ? 'catalog_products' : 'catalog_services';

  async function load() {
    setLoading(true);
    try {
      const colRef = collection(FbDB, 'ai_agents', AGENT_ID, collectionName);
      const snap = await getDocs(colRef);
      const list: Item[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as Item) }));
      setItems(list);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* cada vez que cambie kind */ }, [kind]);

  async function save(item: Item) {
    // create vs update
    if (!item.name || item.name.trim().length === 0) return;
    const colRef = collection(FbDB, 'ai_agents', AGENT_ID, collectionName);
    if (!item.id) {
      await addDoc(colRef, {
        name: item.name.trim(),
        description: item.description || '',
        price: Number.isFinite(item.price) ? Number(item.price) : null,
        photoUrl: item.photoUrl || '',
        options: item.options || [],
        features: item.features || [],
        active: item.active ?? true,
        createdAt: Date.now()
      });
    } else {
      const docRef = doc(FbDB, 'ai_agents', AGENT_ID, collectionName, item.id);
      await updateDoc(docRef, {
        name: item.name.trim(),
        description: item.description || '',
        price: Number.isFinite(item.price) ? Number(item.price) : null,
        photoUrl: item.photoUrl || '',
        options: item.options || [],
        features: item.features || [],
        active: item.active ?? true,
        updatedAt: Date.now()
      });
    }
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    const docRef = doc(FbDB, 'ai_agents', AGENT_ID, collectionName, id);
    await deleteDoc(docRef);
    await load();
  }

  async function uploadImage(file: File): Promise<string> {
    setUploading(true);
    try {
      const filename = `${Date.now()}_${file.name}`;
      const path = `Agents/${AGENT_ID}/catalog/${kind}/images/${filename}`;
      const r = ref(FbStorage, path);
      await uploadBytes(r, file);
      return await getDownloadURL(r);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={s.grid1}>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <span className={s.label}>Tipo:</span>
        <button
          className={`${s.btn} ${s.tab}`} aria-selected={kind==='products'}
          onClick={()=>setKind('products')}><FM id="cloudq.products" defaultMessage="Productos"/></button>
        <button
          className={`${s.btn} ${s.tab}`} aria-selected={kind==='services'}
          onClick={()=>setKind('services')}><FM id="cloudq.services" defaultMessage="Servicios"/></button>
      </div>

      <div className={s.toolbar}>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={()=>setEditing({
          name:'', description:'', price: undefined, options:[], features:[], active:true
        })}>+ Nuevo</button>
        <button className={s.btn} onClick={load} disabled={loading}>Recargar</button>
      </div>

      {editing && (
        <div className={s.fieldset}>
          <div className={s.grid2}>
            <label className={s.label}><FM id="agentCatalog.name" defaultMessage="Nombre"/>
              <input className={s.input} value={editing.name}
                     onChange={e=>setEditing({...editing, name:e.target.value})}/>
            </label>
            <label className={s.label}><FM id="agentCatalog.price" defaultMessage="Precio"/>
              <input className={s.input} type="number" value={editing.price ?? ''}
                     onChange={e=>setEditing({...editing, price: Number(e.target.value)})}/>
            </label>
            <label className={s.label}><FM id="agentCatalog.description" defaultMessage="Descripción"/>
              <input className={s.input} value={editing.description ?? ''}
                     onChange={e=>setEditing({...editing, description:e.target.value})}/>
            </label>
            <label className={s.label}><FM id="agentCatalog.photoUrl" defaultMessage="URL de Foto"/>
              <input className={s.input} value={editing.photoUrl ?? ''}
                     onChange={e=>setEditing({...editing, photoUrl:e.target.value})}/>
            </label>
            <label className={s.label}><FM id="agentCatalog.uploadImage" defaultMessage="Subir imagen"/>
              <input className={s.input} type="file" accept="image/*"
                     onChange={async e=>{
                       const f = e.target.files?.[0]; if (!f) return;
                       const url = await uploadImage(f);
                       setEditing({...editing, photoUrl: url});
                     }}/>
            </label>
            <label className={s.label}><FM id="agentCatalog.options" defaultMessage="Opciones (coma)"/>
              <input className={s.input} value={(editing.options||[]).join(',')}
                     onChange={e=>setEditing({...editing, options: e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/>
            </label>
            <label className={s.label}><FM id="agentCatalog.features" defaultMessage="Características (coma)"/>
              <input className={s.input} value={(editing.features||[]).join(',')}
                     onChange={e=>setEditing({...editing, features: e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/>
            </label>
            <label className={s.label}>
              <span style={{display:'flex', alignItems:'center', gap:8}}>
                <input type="checkbox" checked={editing.active ?? true}
                       onChange={e=>setEditing({...editing, active: e.target.checked})}/>
                <FM id="agentCatalog.active" defaultMessage="Activo"/>
              </span>
            </label>
          </div>

          <div className={s.toolbar}>
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={()=>save(editing)} disabled={uploading}>
              <FM id="agentCatalog.save" defaultMessage="Guardar"/> {uploading ? '(subiendo imagen...)' : ''}
            </button>
            <button className={`${s.btn} ${s.btnGhost}`} onClick={()=>setEditing(null)}><FM id="agentCatalog.cancel" defaultMessage="Cancelar"/></button>
          </div>
        </div>
      )}

      <div className={s.grid1}>
        {loading ? <div><FM id="agentCatalog.loading" defaultMessage="Cargando…"/></div> : items.length === 0 ? <div><FM id="agentCatalog.noItems" defaultMessage="No hay items"/></div> : (
          items.map(it => (
            <div key={it.id} className={s.fieldset}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                {it.photoUrl && <img src={it.photoUrl} alt={it.name} style={{width:64, height:64, objectFit:'cover', borderRadius:12}}/>}
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{it.name} {typeof it.price==='number' && <span style={{opacity:.8}}>${it.price.toFixed(2)}</span>}</div>
                  <div style={{opacity:.8, fontSize:13}}>{it.description}</div>
                </div>
                <button className={s.btn} onClick={()=>setEditing(it)}><FM id="agentCatalog.edit" defaultMessage="Editar"/></button>
                <button className={`${s.btn} ${s.btnDanger}`} onClick={()=>it.id && remove(it.id!)}><FM id="agentCatalog.delete" defaultMessage="Eliminar"/></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
