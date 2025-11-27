import React from 'react'; import OriginalPage from '../../offline/page';
type L='es'|'en'|'fr'; export default async function Wrapped(props:any){
  const mp=props?.params; const p=mp&&typeof mp?.then==='function'?await mp:mp;
  const locale:L=(p?.locale??'es') as L;
  return <OriginalPage {...props} params={{...p,locale}} locale={locale}/>;
}