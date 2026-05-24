import Image from "next/image";

const programs = [
  {
    title: "Control de Trabajo",
    icon: "/icons/control-trabajo.png",
    href: "https://ats-piloto-eies.vercel.app/ats",
    external: true,
  },
  {
    title: "Trabajo en Alturas",
    icon: "/icons/trabajo-alturas.png",
    href: "#",
    external: false,
  },
  {
    title: "Salud",
    icon: "/icons/salud.png",
    href: "#",
    external: false,
  },
  {
    title: "Ambiental",
    icon: "/icons/ambiental.png",
    href: "https://huella-carbon-ia.vercel.app",
    external: true,
  },
  {
    title: "Seguridad Vial",
    icon: "/icons/seguridad-vial.png",
    href: "/gestion-viajes",
    external: false,
  },
  {
    title: "Espacios Confinados",
    icon: "/icons/espacios-confinados.png",
    href: "#",
    external: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-950">
            Portal HSEQ IA
          </h1>

          <Image
            src="/logo-eies.png"
            alt="Logo Estrella"
            width={220}
            height={80}
            className="h-20 w-auto object-contain"
            priority
          />
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {programs.map((program) => (
            <a
              key={program.title}
              href={program.href}
              target={program.external ? "_blank" : undefined}
              rel={program.external ? "noreferrer" : undefined}
              aria-label={program.title}
              className="group rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-6">
                <Image
                  src={program.icon}
                  alt={program.title}
                  width={300}
                  height={220}
                  className="h-44 w-auto object-contain transition duration-300 group-hover:scale-105"
                />

                <div className="rounded-xl border border-neutral-300 px-6 py-2 text-sm font-semibold text-neutral-900 transition group-hover:bg-neutral-950 group-hover:text-white">
                  Ingresar
                </div>
              </div>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}