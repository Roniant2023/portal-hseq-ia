export default function InspeccionesPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <a
            href="/control-trabajo"
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a Control de Trabajo
          </a>

          <h1 className="text-3xl font-bold mt-2">
            Inspecciones HSEQ
          </h1>

          <p className="text-sm text-neutral-600">
            Gestión y seguimiento de inspecciones operativas HSEQ.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/control-trabajo/inspecciones/extintores"
            className="border rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition"
          >
            <div className="text-4xl mb-3">🧯</div>

            <div className="text-xl font-bold">
              Extintores
            </div>

            <div className="text-sm text-neutral-600 mt-2">
              Registro, consulta e inspección de extintores.
            </div>
          </a>
        </section>
      </div>
    </main>
  );
}