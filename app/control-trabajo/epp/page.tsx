"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const modules = [
  {
    title: "Dashboard EPP",
    description:
      "Indicadores de entregas, inventario, reposiciones y cumplimiento.",
    icon: "📊",
    href: "/control-trabajo/epp/dashboard",
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
      "Controlar existencias, entradas, catálogo y movimientos de EPP.",
    icon: "📦",
    href: "/control-trabajo/epp/inventario",
  },
  {
    title: "Aprobaciones",
    description:
      "Revisar y decidir solicitudes de reposición de EPP que requieren autorización.",
    icon: "✅",
    href: "/control-trabajo/epp/aprobaciones",
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
  const router = useRouter();

  const [verificando, setVerificando] = useState(true);
  const [puedeVer, setPuedeVer] = useState(false);

  const [puedeAprobarReposiciones, setPuedeAprobarReposiciones] =
    useState(false);

  const [pendientesAprobacion, setPendientesAprobacion] =
    useState(0);
const [pendientesEntrega, setPendientesEntrega] =
  useState(0);
  useEffect(() => {
    let activo = true;

    async function validarAcceso() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!activo) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase.rpc(
          "puede_acceder_modulo",
          {
            p_user_id: user.id,
            p_modulo: "EPP",
          }
        );

        if (!activo) return;

        if (error) {
          console.error("Error validando acceso a EPP:", error);
          router.replace("/");
          return;
        }

        if (data !== true) {
          router.replace("/");
          return;
        }

        setPuedeVer(true);
const {
  count: countPendientesEntrega,
  error: errorPendientesEntrega,
} = await supabase
  .from("epp_reposiciones")
  .select("id", {
    count: "exact",
    head: true,
  })
  .eq("estado", "APROBADA")
  .eq("requiere_aprobacion", true)
  .is("nueva_entrega_id", null);

if (!activo) return;

if (errorPendientesEntrega) {
  console.error(
    "Error consultando entregas pendientes:",
    errorPendientesEntrega
  );
} else {
  setPendientesEntrega(countPendientesEntrega ?? 0);
}
        const {
          data: permisoAprobacion,
          error: errorPermisoAprobacion,
        } = await supabase.rpc(
          "puede_aprobar_reposiciones_epp",
          {
            p_user_id: user.id,
          }
        );

        if (!activo) return;

        if (errorPermisoAprobacion) {
          console.error(
            "Error validando permiso de aprobación de reposiciones:",
            errorPermisoAprobacion
          );
        } else if (permisoAprobacion === true) {
          setPuedeAprobarReposiciones(true);

          const {
            count,
            error: errorPendientes,
          } = await supabase
            .from("epp_reposiciones")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("estado", "PENDIENTE_APROBACION");

          if (!activo) return;

          if (errorPendientes) {
            console.error(
              "Error consultando reposiciones pendientes:",
              errorPendientes
            );
          } else {
            setPendientesAprobacion(count ?? 0);
          }
        }
      } catch (err) {
        console.error("Error validando acceso a EPP:", err);

        if (activo) {
          router.replace("/");
        }
      } finally {
        if (activo) {
          setVerificando(false);
        }
      }
    }

    validarAcceso();

    return () => {
      activo = false;
    };
  }, [router]);

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="font-semibold text-neutral-600">
          Validando acceso...
        </p>
      </main>
    );
  }

  if (!puedeVer) {
    return null;
  }

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
{module.title === "Entregar EPP" &&
  pendientesEntrega > 0 && (
    <div className="mt-3">
      <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />

        {pendientesEntrega}{" "}
        {pendientesEntrega === 1
          ? "entrega pendiente"
          : "entregas pendientes"}
      </span>
    </div>
  )}
              {module.title === "Aprobaciones" &&
                puedeAprobarReposiciones && (
                  <div className="mt-3">
                    {pendientesAprobacion > 0 ? (
                      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                        {pendientesAprobacion}{" "}
                        {pendientesAprobacion === 1
                          ? "solicitud pendiente"
                          : "solicitudes pendientes"}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                        Sin pendientes
                      </span>
                    )}
                  </div>
                )}

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