import 'server-only';


const SAFE_PREFIX = 'NEXT_PUBLIC_';
const SAFE_KEYS = ['NIXINX_LICENSE_TOKEN']; // opcional pre-cargar; puedes omitir si no quieres mostrarlo


export async function GET() {
const out: Record<string, string> = {};
Object.keys(process.env).forEach((k) => {
if (k.startsWith(SAFE_PREFIX) || SAFE_KEYS.includes(k)) {
const v = process.env[k];
if (typeof v === 'string') out[k] = v;
}
});
return Response.json(out);
}