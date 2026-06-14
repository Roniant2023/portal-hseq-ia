import Image from "next/image";
import Link from "next/link";

const modules = [
 {
  title: "Programar charla",
  description: "Programar una charla HSEQ y cargar su cuestionario.",
  icon: "/icons/charlas-hseq.png",
  href: "/ambiental/charlas/crear",
},
{
  title: "Gestión de charlas",
  description: "Consultar charlas programadas, ejecutadas y participantes.",
  icon: "/icons/charlas-hseq.png",
  href: "/ambiental/charlas/listado",
},
];

export default function CharlasHSEQPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-neutral-950 md:text-5xl">
              Charlas HSEQ
            </h1>

            <p className="mt-2 text-neutral-600">
              Gestión de charlas ambientales y de seguridad con cuestionarios,
              asistencia QR y actas.
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

        <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="group rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
<div className="flex min-h-[220px] flex-col items-center justify-center gap-6 text-center">

  <Image
    src={module.icon}
    alt={module.title}
    width={120}
    height={120}
    className="h-24 w-auto object-contain"
  />

  <h2 className="text-2xl font-bold">
    {module.title}
  </h2>

  <p className="text-sm text-neutral-600">
    {module.description}
  </p>

  <div className="rounded-xl border border-neutral-300 px-6 py-2 text-sm font-semibold text-neutral-900 transition group-hover:bg-neutral-950 group-hover:text-white">
    Ingresar
  </div>

</div>              

            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}