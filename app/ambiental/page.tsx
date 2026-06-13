import Image from "next/image";

const environmentalModules = [
  {
    title: "Huella de Carbono",
    description:
      "Cálculo y seguimiento de emisiones de gases de efecto invernadero.",
    icon: "/icons/huella-carbono.png",
    href: "https://huella-carbon-ia.vercel.app",
    external: true,
  },
  {
    title: "Registro Fotográfico ICA",
    description:
      "Registro fotográfico georreferenciado para cumplimiento e informes ICA.",
    icon: "/icons/registro-fotografico.png",
    href: "/ambiental/inspecciones",
    external: false,
  },
];

export default function AmbientalPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-950">
              Programa Ambiental
            </h1>

            <p className="mt-2 text-neutral-600">
              Herramientas para la gestión ambiental y cumplimiento operativo.
            </p>
          </div>

          <Image
            src="/logo-eies.png"
            alt="Logo Estrella"
            width={220}
            height={80}
            className="h-20 w-auto object-contain"
            priority
          />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {environmentalModules.map((module) => (
            <a
              key={module.title}
              href={module.href}
              target={module.external ? "_blank" : undefined}
              rel={module.external ? "noreferrer" : undefined}
              className="group rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-6">
                <Image
                  src={module.icon}
                  alt={module.title}
                  width={220}
                  height={220}
                  className="h-36 w-auto object-contain transition duration-300 group-hover:scale-105"
                />

                <div className="text-center">
                  <h2 className="text-xl font-bold">
                    {module.title}
                  </h2>

                  <p className="mt-2 text-sm text-neutral-600">
                    {module.description}
                  </p>
                </div>

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