"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PermisoModulo = {
  modulo: string;
  puede_ver: boolean;
  puede_editar: boolean;
};

const tools = [
  {
    title: "ATS Digital",
    description:
      "Análisis de Trabajo Seguro con apoyo de inteligencia artificial.",
    href: "https://ats-piloto-eies.vercel.app",
    modulo: "ATS",
  },
  {
    title: "Tarjetas de Observación SOE",
    description:
      "Registro de observaciones HSEQ, evidencias y seguimiento.",
    href: "https://soe-inteligente.vercel.app",
    modulo: "SOE",
  },
  {
    title: "Inspecciones HSEQ",
    description:
      "Extintores, equipos, vehículos, herramientas y más.",
    href: "/control-trabajo/inspecciones",
    modulo: "INSPECCIONES",
  },
  {
    title: "Gestión de EPP",
    description:
      "Entrega, inventario, reposición y seguimiento de elementos de protección personal.",
    href: "/control-trabajo/epp",
    modulo: "EPP",
  },
];

export default function ControlTrabajoPage() {
  const [permisos, setPermisos] = useState<PermisoModulo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarPermisos() {
      const { data, error } = await supabase.rpc("mis_permisos_portal");

      if (error) {
        console.error("Error cargando permisos:", error);
        setPermisos([]);
        setCargando(false);
        return;
      }

      setPermisos(data ?? []);
      setCargando(false);
    }

    cargarPermisos();
  }, []);

  const toolsVisibles = useMemo(() => {
    return tools.filter((tool) =>
      permisos.some(
        (permiso) =>
          permiso.modulo === tool.modulo &&
          permiso.puede_ver === true
      )
    );
  }, [permisos]);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <a
              href="/"
              className="text-sm text-neutral-600 hover:text-neutral-950"
            >
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

        {cargando ? (
          <div className="py-16 text-center font-semibold text-neutral-500">
            Cargando módulos autorizados...
          </div>
        ) : toolsVisibles.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-10 text-center">
            <h2 className="text-xl font-black">
              Sin módulos autorizados
            </h2>

            <p className="mt-2 text-neutral-600">
              Tu usuario no tiene permisos para los módulos de Control de Trabajo.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {toolsVisibles.map((tool) => (
              <a
                key={tool.title}
                href={tool.href}
                target={
                  tool.href.startsWith("http")
                    ? "_blank"
                    : undefined
                }
                rel={
                  tool.href.startsWith("http")
                    ? "noreferrer"
                    : undefined
                }
                className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h2 className="text-2xl font-black">
                  {tool.title}
                </h2>

                <p className="mt-3 text-sm text-neutral-600">
                  {tool.description}
                </p>

                <div className="mt-8 inline-flex rounded-xl border border-neutral-300 px-6 py-2 text-sm font-semibold transition hover:bg-neutral-950 hover:text-white">
                  Ingresar
                </div>
              </a>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}