const modules = [
  {
    title: "Dashboard EPP",
    description:
      "Indicadores de entregas, inventario, reposiciones y cumplimiento.",
    icon: "📊",
    href: "#",
  },
  {
  title: "Entregar EPP",
  description:
    "Registrar la entrega de elementos de protección personal a trabajadores.",
  icon: "🦺",
  href: "/control-trabajo/epp/entregar",
},
 {
  title: "Trabajadores",
  description:
    "Consultar la dotación actual y el historial individual de cada trabajador.",
  icon: "👷",
  href: "/control-trabajo/epp/trabajadores",
},
 {
  title: "Inventario",
  description:
    "Controlar existencias, tallas, ubicaciones y movimientos de EPP.",
  icon: "📦",
  href: "/control-trabajo/epp/inventario",
},
  {
    title: "Catálogo de EPP",
    description:
      "Administrar los elementos de protección personal disponibles.",
    icon: "🥽",
    href: "/control-trabajo/epp/catalogo",
  },
  {
    title: "Reposiciones",
    description:
      "Registrar cambios, deterioros, pérdidas y reposiciones extraordinarias.",
    icon: "🔄",
    href: "#",
  },
  {
    title: "Reportes",
    description:
      "Consultar historial, consumos, costos, vencimientos y trazabilidad.",
    icon: "📑",
    href: "#",
  },
];

export default function EppPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <header className="space-y-3">
          <a
            href="/control-trabajo"
            className="text-sm text-neutral-600 hover:text-neutral-950"
          >
            ← Volver a Control de Trabajo
          </a>

          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Gestión de EPP
            </h1>

            <p className="mt-2 text-sm md:text-base text-neutral-600 max-w-3xl">
              Control de entrega, inventario, reposición y trazabilidad de
              elementos de protección personal.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {modules.map((module) => (
            <a
              key={module.title}
              href={module.href}
              className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-4xl mb-4">{module.icon}</div>

              <h2 className="text-xl font-black">
                {module.title}
              </h2>

              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                {module.description}
              </p>

              <div className="mt-6 inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold transition group-hover:bg-neutral-950 group-hover:text-white">
                Ingresar
              </div>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}