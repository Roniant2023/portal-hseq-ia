import Image from "next/image";

const tools = [
  {
    title: "ATS Digital",
    description: "Análisis de Trabajo Seguro con apoyo de inteligencia artificial.",
    href: "https://ats-piloto-eies.vercel.app/ats",
  },
  {
    title: "Tarjetas de Observación SOE",
    description: "Registro de observaciones HSEQ, evidencias y seguimiento.",
    href: "https://soe-inteligente.vercel.app",
  },
];

export default function ControlTrabajoPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <a href="/" className="text-sm text-neutral-600 hover:text-neutral-950">
              ← Volver al portal
            </a>

            <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight">
              Control de Trabajo
            </h1>
          </div>

          <Image
            src="/icons/control-trabajo.png"
            alt="Control de Trabajo"
            width={220}
            height={160}
            className="h-28 w-auto object-contain"
            priority
          />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <a
              key={tool.title}
              href={tool.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-2xl font-black">{tool.title}</h2>

              <p className="mt-3 text-sm text-neutral-600">
                {tool.description}
              </p>

              <div className="mt-8 inline-flex rounded-xl border border-neutral-300 px-6 py-2 text-sm font-semibold transition hover:bg-neutral-950 hover:text-white">
                Ingresar
              </div>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}