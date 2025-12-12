"use client";

import Image from "next/image";
import Link from "next/link";

export default function HotTacosHomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-zinc-50">
      {/* HERO */}
      <section className="relative min-h-[80vh] overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0">
          <Image
            src="/images/htl/hero-tacos.jpg"
            alt="Hot Tacos Leamington - Tacos al pastor y ambiente nocturno"
            fill
            priority
            className="object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-between min-h-[80vh] px-6 py-10 md:px-12 lg:px-20">
          {/* Top bar básica */}
          <header className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {/* Logo provisional */}
              <div className="h-10 w-10 rounded-full bg-lime-500 flex items-center justify-center text-black font-bold">
                HT
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-lime-400">
                  Hot Tacos
                </p>
                <p className="text-sm md:text-base text-zinc-200">
                  Leamington · Ontario
                </p>
              </div>
            </div>

            {/* Navegación simple (después se puede alinear a tu Nav global) */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-200">
              <a href="#concepto" className="hover:text-lime-400 transition-colors">
                Concepto
              </a>
              <a href="#menu" className="hover:text-lime-400 transition-colors">
                Menú
              </a>
              <a
                href="#experiencia"
                className="hover:text-lime-400 transition-colors"
              >
                Experiencia
              </a>
              <a
                href="#reservas"
                className="hover:text-lime-400 transition-colors"
              >
                Reservas
              </a>
            </nav>
          </header>

          {/* Hero principal */}
          <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                Tacos con alma{" "}
                <span className="text-lime-400">mexicana</span> en Leamington.
              </h1>
              <p className="mt-4 text-sm md:text-base text-zinc-200 max-w-lg">
                Hot Tacos Leamington es donde el{" "}
                <span className="font-semibold">sabor callejero</span> se cruza
                con un ambiente cómodo, música, amigos y una chela fría. Nada de
                complicaciones: solo buena comida y mejor vibe.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                {/* Aquí después puedes sustituir por tu Wrapper de Button */}
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center rounded-full bg-lime-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-lime-500/40 hover:bg-lime-400 transition-colors"
                >
                  Ver menú
                </Link>
                <Link
                  href="/reservations"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-100 hover:border-lime-400 hover:text-lime-400 transition-colors"
                >
                  Reservar mesa
                </Link>
                <p className="w-full text-xs text-zinc-400 md:w-auto">
                  Cocina abierta hoy hasta las 11:00 PM*
                </p>
              </div>
            </div>

            {/* Tarjeta rápida de info */}
            <div className="ml-auto w-full max-w-sm rounded-3xl bg-black/60 border border-zinc-800 backdrop-blur-md p-5 flex flex-col gap-4">
              <h2 className="text-sm font-semibold tracking-[0.22em] uppercase text-zinc-400">
                Hoy en Hot Tacos
              </h2>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-zinc-400">Especial del día</span>
                  <span className="font-medium">Tacos al pastor & margarita</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-zinc-400">Happy hour</span>
                  <span className="font-medium">4:00 – 6:00 PM</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-zinc-400">Ubicación</span>
                  <span className="font-medium text-right">
                    Downtown Leamington, ON
                  </span>
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                *Horarios y promos pueden cambiar. Pregunta en el local o revisa
                nuestras redes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONCEPTO */}
      <section
        id="concepto"
        className="px-6 py-14 md:px-12 lg:px-20 bg-neutral-950"
      >
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-lime-400">
              Nuestro concepto
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold">
              De la calle de México a la esquina de Leamington.
            </h2>
            <p className="mt-4 text-sm md:text-base text-zinc-200">
              Hot Tacos Leamington toma lo mejor de los{" "}
              <span className="font-semibold">tacos callejeros</span> y lo trae
              a un espacio cómodo, moderno y cercano. Tortillas calientes,
              salsas hechas en casa y combinaciones pensadas para que cada
              visita se sienta como una noche en México.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Sabores
                </p>
                <p className="mt-2 text-zinc-100">
                  Clásicos como pastor, asada y suadero, más opciones veggies y
                  especiales de temporada.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Ambiente
                </p>
                <p className="mt-2 text-zinc-100">
                  Luz cálida, música latina y un servicio relajado pero atento.
                  Ideal para ir con amigos o en pareja.
                </p>
              </div>
            </div>
          </div>

          <div className="relative h-64 md:h-80 lg:h-96">
            <Image
              src="/images/htl/interior-01.jpg"
              alt="Interior de Hot Tacos Leamington"
              fill
              className="object-cover rounded-3xl border border-zinc-800"
            />
          </div>
        </div>
      </section>

      {/* MENÚ DESTACADO */}
      <section
        id="menu"
        className="px-6 py-14 md:px-12 lg:px-20 bg-gradient-to-b from-neutral-950 to-black"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-lime-400">
              Menú destacado
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold">
              Tacos que tienes que probar sí o sí.
            </h2>
            <p className="mt-3 text-sm md:text-base text-zinc-200 max-w-xl">
              Una probadita de lo que encontrarás en el menú. Perfecto para tu
              primera visita… o para cuando no te quieres complicar.
            </p>
          </div>
          <Link
            href="/menu"
            className="hidden md:inline-flex items-center justify-center rounded-full border border-lime-500 px-5 py-2 text-xs font-semibold text-lime-400 hover:bg-lime-500 hover:text-black transition-colors"
          >
            Ver menú completo
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {featuredTacos.map((taco) => (
            <article
              key={taco.name}
              className="group rounded-3xl border border-zinc-800 bg-black/40 overflow-hidden flex flex-col"
            >
              <div className="relative h-40">
                <Image
                  src={taco.image}
                  alt={taco.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{taco.name}</h3>
                  <span className="rounded-full bg-lime-500/10 px-3 py-1 text-xs font-semibold text-lime-400 border border-lime-500/40">
                    {taco.tag}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{taco.description}</p>
                <p className="mt-auto text-sm font-medium text-zinc-100">
                  Desde {taco.price}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 md:hidden">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center rounded-full border border-lime-500 px-5 py-2 text-xs font-semibold text-lime-400 hover:bg-lime-500 hover:text-black transition-colors"
          >
            Ver menú completo
          </Link>
        </div>
      </section>

      {/* EXPERIENCIA / GALERÍA */}
      <section
        id="experiencia"
        className="px-6 py-14 md:px-12 lg:px-20 bg-black"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-lime-400">
              La experiencia
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold">
              Más que tacos, una noche completa.
            </h2>
            <p className="mt-3 text-sm md:text-base text-zinc-200 max-w-xl">
              Shots, micheladas, platitos para compartir y ese momento en el que
              alguien dice: “¿pedimos otra ronda?” Sí, eso también está
              incluido.
            </p>
          </div>
          <p className="text-xs text-zinc-400 max-w-xs">
            Tip: reserva si vienes en grupo grande o en fin de semana. Nos
            gusta el movimiento, pero se llena rápido.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {galleryImages.map((img) => (
              <div
                key={img.alt}
                className="relative h-52 w-80 shrink-0 rounded-3xl overflow-hidden border border-zinc-800"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <p className="absolute bottom-3 left-4 text-sm font-medium text-zinc-50 drop-shadow">
                  {img.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESERVAS / UBICACIÓN */}
      <section
        id="reservas"
        className="px-6 py-14 md:px-12 lg:px-20 bg-neutral-950"
      >
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-lime-400">
              Reservas & pedidos
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold">
              Ven a cenar, pide para llevar o arma tu evento.
            </h2>
            <p className="mt-3 text-sm md:text-base text-zinc-200 max-w-xl">
              Ya sea que quieras algo rápido entre semana, una salida de
              viernes o celebrar un cumpleaños, tenemos una mesa (o una charola
              de tacos) lista para ti.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm">
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Reservas
                </p>
                <p className="mt-2 text-zinc-100">
                  Reserva tu mesa en línea para asegurar lugar, sobre todo
                  fines de semana.
                </p>
                <Link
                  href="/reservations"
                  className="mt-3 inline-flex text-xs font-semibold text-lime-400 hover:text-lime-300"
                >
                  Reservar ahora →
                </Link>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Para llevar
                </p>
                <p className="mt-2 text-zinc-100">
                  Ordena para recoger y llévate los tacos a casa, a la oficina
                  o donde esté la reunión.
                </p>
                <Link
                  href="/order"
                  className="mt-3 inline-flex text-xs font-semibold text-lime-400 hover:text-lime-300"
                >
                  Hacer pedido →
                </Link>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Eventos
                </p>
                <p className="mt-2 text-zinc-100">
                  Caterings, cumpleaños, empresas. Hablamos y armamos un menú a
                  tu medida.
                </p>
                <Link
                  href="/events"
                  className="mt-3 inline-flex text-xs font-semibold text-lime-400 hover:text-lime-300"
                >
                  Solicitar info →
                </Link>
              </div>
            </div>
          </div>

          {/* Bloque de horarios / mapa placeholder */}
          <div className="rounded-3xl border border-zinc-800 bg-black/50 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-[0.2em] uppercase text-zinc-400">
              Horarios & ubicación
            </h3>
            <div className="text-sm space-y-2">
              <p className="font-medium text-zinc-100">Hot Tacos Leamington</p>
              <p className="text-zinc-300">
                Dirección exacta aquí<br />
                Leamington, Ontario, Canadá
              </p>
              <p className="text-zinc-300">Tel: (XXX) XXX-XXXX</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
              <div>
                <p className="font-semibold text-zinc-100">Lun – Jue</p>
                <p>4:00 PM – 10:00 PM</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-100">Vie – Sáb</p>
                <p>4:00 PM – 11:00 PM</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-100">Domingo</p>
                <p>3:00 PM – 9:00 PM</p>
              </div>
            </div>
            <div className="mt-3 h-40 rounded-2xl bg-gradient-to-br from-lime-500/10 via-zinc-800 to-black border border-zinc-700 flex items-center justify-center text-xs text-zinc-400">
              Aquí puedes incrustar el mapa (Google Maps / wrapper del core).
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="border-t border-zinc-900 bg-black px-6 py-6 md:px-12 lg:px-20 text-xs text-zinc-500 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p>© {new Date().getFullYear()} Hot Tacos Leamington. Todos los derechos reservados.</p>
        <p className="text-zinc-600">
          Sitio construido sobre NIXINX · Nodo HTL.
        </p>
      </footer>
    </main>
  );
}

// Datos mockeados — ideal para sustituir después con FDV / Firestore / Providers
const featuredTacos = [
  {
    name: "Taco al pastor HTL",
    tag: "Clásico",
    description:
      "Pastor al trompo, piña asada, cebolla, cilantro y salsa de la casa.",
    price: "$4.50 CAD",
    image: "/images/htl/taco-pastor.jpg",
  },
  {
    name: "Gringa de asada",
    tag: "Para compartir",
    description:
      "Tortilla de harina, queso fundido y carne asada al carbón, perfecta para la mesa.",
    price: "$6.50 CAD",
    image: "/images/htl/gringa-asada.jpg",
  },
  {
    name: "Taco veggie de hongos",
    tag: "Veggie",
    description:
      "Hongos salteados con ajo, chile y limón, coronados con guacamole fresco.",
    price: "$4.80 CAD",
    image: "/images/htl/taco-veggie.jpg",
  },
];

const galleryImages = [
  {
    src: "/images/htl/ambiente-01.jpg",
    alt: "Ambiente nocturno en Hot Tacos Leamington",
    caption: "Luz cálida, música latina y tacos sobre la mesa.",
  },
  {
    src: "/images/htl/ambiente-02.jpg",
    alt: "Barra de bebidas y micheladas",
    caption: "Micheladas, margaritas y buenos tragos para acompañar.",
  },
  {
    src: "/images/htl/ambiente-03.jpg",
    alt: "Grupo de amigos comiendo tacos",
    caption: "Ideal para venir en bola y pedir de todo al centro.",
  },
];
