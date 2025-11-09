// app/(nixinx-com)/page.tsx
import CommercialHighlights from "@/components/nixinx/CommercialHighlights";

export default function NixinxComPage() {
  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="grid gap-8 md:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)] md:items-center">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Multi-tenant listo para producción · NIXINX.com
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Una sola plataforma para lanzar, versionar y cuidar
            los sitios de todos tus clientes.
          </h1>

          <p className="max-w-xl text-xs text-zinc-400 sm:text-sm">
            NIXINX orquesta dominios, builds, performance y branding
            para cada marca, sin mezclar presupuestos ni dependencias.
            Cada cliente tiene su propio espacio, tú tienes control total.
          </p>

          <div className="flex flex-wrap gap-3 text-[10px]">
            <a
              href="#contact"
              className="rounded-full bg-zinc-50 px-4 py-2 font-semibold text-black hover:bg-zinc-200"
            >
              Agendar onboarding
            </a>
            <a
              href="#stack"
              className="rounded-full border border-white/15 px-4 py-2 text-zinc-300 hover:border-zinc-400 hover:text-zinc-50"
            >
              Ver cómo funciona
            </a>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-[9px] text-zinc-500">
            <div>
              <div className="text-xs font-semibold text-zinc-100">
                5+ tenants activos
              </div>
              <div>Restaurantes, marcas locales, proyectos en producción.</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-100">
                Deploys en segundos
              </div>
              <div>Git → NIXINX → Vercel por cliente, sin drama.</div>
            </div>
          </div>
        </div>

        {/* Panel lateral diferenciado */}
        <aside className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[9px] text-zinc-300">
          <p className="mb-2 text-[10px] font-semibold text-zinc-200">
            Vista de operador
          </p>
          <ul className="space-y-2">
            <li className="flex items-center justify-between">
              <span>nixinx.org</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-400">
                Core
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>nixinx.com</span>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] text-sky-400">
                Comercial
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>patronbarandgrill.com</span>
              <span className="text-zinc-500">Tenant aislado</span>
            </li>
            <li className="flex items-center justify-between">
              <span>htwindsor.com</span>
              <span className="text-zinc-500">Tenant aislado</span>
            </li>
            <li className="flex items-center justify-between">
              <span>hottacosrestaurant.ca</span>
              <span className="text-zinc-500">Tenant aislado</span>
            </li>
          </ul>
          <p className="mt-3 text-[8px] text-zinc-500">
            Cada dominio mantiene su propio billing, métricas y capas legales.
            NIXINX sólo provee la infraestructura.
          </p>
        </aside>
      </section>

      {/* Módulo comercial */}
      <CommercialHighlights />

      {/* Stack */}
      <section id="stack" className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-50">
          Stack de despliegue transparente
        </h2>
        <p className="max-w-2xl text-xs text-zinc-500">
          Next.js, Vercel, GitHub Actions multi-tenant, monitoreo y patrones
          compartidos. Cada cliente tiene su propio proyecto en Vercel y su
          propio dominio; lo común vive en NIXINX.
        </p>
        <div className="grid gap-3 text-[10px] text-zinc-400 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-3">
            <div className="mb-1 text-xs font-semibold text-zinc-100">
              Aislamiento por proyecto
            </div>
            Nada de monolitos con miedo. Cada marca tiene su entorno limpio.
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-3">
            <div className="mb-1 text-xs font-semibold text-zinc-100">
              Plantillas reutilizables
            </div>
            Componentes compartidos sin romper la identidad de nadie.
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-3">
            <div className="mb-1 text-xs font-semibold text-zinc-100">
              Control centralizado
            </div>
            Un único lugar para revisar deploys, rendimiento y errores.
          </div>
        </div>
      </section>

      {/* Pricing / modelo */}
      <section id="pricing" className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-50">
          Diseñado para agencias y operadores
        </h2>
        <p className="max-w-2xl text-xs text-zinc-500">
          Cada cliente mantiene su propia cuenta en Vercel. Tú administras el
          código, la estructura y los pipelines. Sin mezclar tarjetas, ni
          facturas, ni accesos.
        </p>
      </section>

      {/* Contacto */}
      <section id="contact" className="mt-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 text-xs text-emerald-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-400">
              Siguiente paso
            </div>
            <div className="font-semibold">
              Cuéntanos cuántos tenants operas y te armamos el mapa.
            </div>
          </div>
          <a
            href="mailto:hello@nixinx.com"
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-[10px] font-semibold text-black hover:bg-emerald-300"
          >
            Enviar correo a NIXINX
          </a>
        </div>
      </section>
    </div>
  );
}
