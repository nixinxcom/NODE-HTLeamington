import { headers } from "next/headers";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import seedDicts from "@/app/[locale]/[tenant]/i18n";

type Short = string; // p.ej. "es" | "en" | "fr"
const SUPPORTED_SHORT = Object.keys(seedDicts) as Short[];

const toShort = (l: string) => l.split("-")[0].toLowerCase();
const norm = (s?: string | null) => (s || "").toLowerCase();

function negotiateShort(accept: string | null): Short | null {
  if (!accept) return null;

  // parse: "es-ES;q=0.9,en-US;q=0.8,fr;q=0.7"
  const prefs = accept
    .split(",")
    .map((c) => {
      const [tag, ...p] = c.trim().split(";");
      const q =
        parseFloat((p.find((x) => x.trim().startsWith("q=")) || "").split("=")[1]) ||
        1;
      const low = tag.toLowerCase();
      return { full: low, base: low.split("-")[0], q };
    })
    .sort((a, b) => b.q - a.q);

  // match por base language (short)
  for (const { base } of prefs) {
    const hit = SUPPORTED_SHORT.find((s) => s === base);
    if (hit) return hit;
  }
  return null;
}

export default async function Root() {
  const h = await headers();
  const accept = h.get("accept-language");

  const envDefault = norm(process.env.NEXT_PUBLIC_DEFAULT_LOCALE) || "en";
  const defaultShort =
    (SUPPORTED_SHORT.find((l) => l === envDefault) as Short | undefined) ||
    SUPPORTED_SHORT[0] ||
    "en";

  const clientPref = negotiateShort(accept);
  const targetShort = clientPref ?? defaultShort;

  // redirigimos con el short en tu router /[locale]
  redirect(`/${targetShort}`);
}
