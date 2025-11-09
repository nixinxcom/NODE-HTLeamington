// app/(nixinx-com)/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIXINX — Multi-tenant Web Stack for Modern Brands",
  description:
    "Infraestructura, despliegues y frontends listos para marcas que necesitan velocidad, orden y control.",
};

export default function NixinxComLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#02040A] text-zinc-100 antialiased">
        {/* Top bar */}
        <header className="border-b border-white/5 bg-black/40 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
                N
              </div>
              <div className="leading-tight">
                <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Platform
                </div>
                <div className="text-sm font-medium text-zinc-50">
                  NIXINX.com
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-xs text-zinc-400 md:flex">
              <a href="#stack" className="hover:text-zinc-100">
                Arquitectura
              </a>
              <a href="#clients" className="hover:text-zinc-100">
                Casos reales
              </a>
              <a href="#pricing" className="hover:text-zinc-100">
                Modelo para agencias
              </a>
              <a
                href="#contact"
                className="rounded-full bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-zinc-200"
              >
                Hablar con NIXINX
              </a>
            </nav>
          </div>
        </header>

        {/* Glow background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-[-120px] z-0 mx-auto h-64 max-w-3xl rounded-full bg-gradient-to-b from-indigo-500/15 via-cyan-400/8 to-transparent blur-3xl"
        />

        <main className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-10">
          {children}
        </main>

        <footer className="border-t border-white/5 bg-black/60">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-5 text-[10px] text-zinc-500 sm:flex-row">
            <p>© {new Date().getFullYear()} NIXINX. Infraestructura para múltiples marcas.</p>
            <p className="text-[9px]">
              nixinx.com opera como instancia comercial independiente para cada cliente.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
