import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Portal HSEQ IA
            </h1>
            <p className="text-sm text-neutral-600 mt-2">
              Plataforma de herramientas inteligentes para gestión HSEQ en campo
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
        </div>

        <section className="border rounded p-5">
          <div className="text-xs text-neutral-600">Gestión de HSSEQ</div>
          <div className="text-xl font-semibold mt-1">
            Seleccione la herramienta que desea utilizar
          </div>
          <p className="text-sm text-neutral-600 mt-2">
            Acceda rápidamente a los módulos disponibles para operación y
            seguimiento en campo.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://ats-piloto-eies.vercel.app/ats"
            target="_blank"
            rel="noreferrer"
            className="border rounded p-6 hover:bg-neutral-50 transition"
          >
            <div className="text-xs text-neutral-500">Módulo 01</div>
            <h2 className="text-2xl font-semibold mt-2">ATS Inteligente</h2>
            <p className="text-sm text-neutral-600 mt-3">
              Generación y gestión de análisis de trabajo seguro con apoyo de
              inteligencia artificial.
            </p>

            <div className="mt-6 inline-flex items-center rounded border px-4 py-2 text-sm font-medium">
              Ingresar
            </div>
          </a>

          <a
            href="https://soe-inteligente.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="border rounded p-6 hover:bg-neutral-50 transition"
          >
            <div className="text-xs text-neutral-500">Módulo 02</div>
            <h2 className="text-2xl font-semibold mt-2">SOE Inteligente</h2>
            <p className="text-sm text-neutral-600 mt-3">
              Registro de observaciones HSEQ con asistencia de IA, historial,
              detalle y evidencia fotográfica.
            </p>

            <div className="mt-6 inline-flex items-center rounded border px-4 py-2 text-sm font-medium">
              Ingresar
            </div>
          </a>
        </section>
      </div>
    </main>
  );
}