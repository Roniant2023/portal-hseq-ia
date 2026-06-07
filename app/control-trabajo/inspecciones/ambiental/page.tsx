export default function AmbientalPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <a
            href="/control-trabajo/inspecciones"
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a Inspecciones
          </a>

          <h1 className="text-3xl font-bold mt-2">
            Inspección Ambiental
          </h1>

          <p className="text-sm text-neutral-600">
            Módulo en construcción para inspección ambiental, orden y aseo, kit ambiental y evidencias.
          </p>
        </div>
      </div>
    </main>
  );
}