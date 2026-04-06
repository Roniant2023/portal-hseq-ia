import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
              Portal HSEQ IA
            </h1>
            <p className="text-sm text-neutral-700 mt-2">
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

        <section className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">
          <div className="text-xs text-neutral-700 font-medium">
            Gestión de HSSEQ
          </div>
          <div className="text-xl font-semibold mt-1 text-neutral-900">
            Seleccione la herramienta que desea utilizar
          </div>
          <p className="text-sm text-neutral-700 mt-2">
            Acceda rápidamente a los módulos disponibles para operación,
            seguimiento y control en campo.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <a
            href="https://ats-piloto-eies.vercel.app/ats"
            target="_blank"
            rel="noreferrer"
            className="border border-neutral-200 rounded-xl p-6 hover:bg-neutral-50 transition shadow-sm"
          >
            <div className="text-xs text-neutral-700 font-medium">Módulo 01</div>
            <h2 className="text-2xl font-semibold mt-2 text-neutral-900">
              ATS Inteligente
            </h2>
            <p className="text-sm text-neutral-700 mt-3">
              Generación y gestión de análisis de trabajo seguro con apoyo de
              inteligencia artificial.
            </p>

            <div className="mt-6 inline-flex items-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900">
              Ingresar
            </div>
          </a>

          <a
            href="https://soe-inteligente.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="border border-neutral-200 rounded-xl p-6 hover:bg-neutral-50 transition shadow-sm"
          >
            <div className="text-xs text-neutral-700 font-medium">Módulo 02</div>
            <h2 className="text-2xl font-semibold mt-2 text-neutral-900">
              SOE Inteligente
            </h2>
            <p className="text-sm text-neutral-700 mt-3">
              Registro de observaciones HSEQ con asistencia de IA, historial,
              detalle y evidencia fotográfica.
            </p>

            <div className="mt-6 inline-flex items-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900">
              Ingresar
            </div>
          </a>

          <a
            href="https://huella-carbon-ia.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="border border-neutral-200 rounded-xl p-6 hover:bg-neutral-50 transition shadow-sm"
          >
            <div className="text-xs text-neutral-700 font-medium">Módulo 03</div>
            <h2 className="text-2xl font-semibold mt-2 text-neutral-900">
              Huella de Carbono Inteligente
            </h2>
            <p className="text-sm text-neutral-700 mt-3">
              Estimación de consumo y emisiones CO₂e por unidad operativa,
              cálculo por motor, historial y exportación a Excel.
            </p>

            <div className="mt-6 inline-flex items-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900">
              Ingresar
            </div>
          </a>
        </section>
      </div>
    </main>
  );
}