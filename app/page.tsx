"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import UserSessionBar from "./components/UserSessionBar";
import { supabase } from "@/lib/supabase";

type PermisoModulo = {
  modulo: string;
  puede_ver: boolean;
  puede_editar: boolean;
};

type PerfilPortal = {
  nombre: string | null;
  rol: string | null;
  activo: boolean | null;
};

const programs = [
  {
    title: "Control de Trabajo",
    icon: "/icons/control-trabajo.png",
    href: "/control-trabajo",
    external: false,
    modulos: ["EPP", "ATS", "SOE", "INSPECCIONES"],
  },
  {
    title: "Trabajo en Alturas",
    icon: "/icons/trabajo-alturas.png",
    href: "/trabajo-alturas/equipos",
    external: false,
    modulos: ["ALTURAS"],
  },
  {
    title: "Salud",
    icon: "/icons/salud.png",
    href: "#",
    external: false,
    modulos: ["SALUD"],
  },
  {
    title: "Ambiental",
    icon: "/icons/ambiental.png",
    href: "/ambiental",
    external: false,
    modulos: ["AMBIENTAL"],
  },
  {
    title: "Seguridad Vial",
    icon: "/icons/seguridad-vial.png",
    href: "/gestion-viajes",
    external: false,
    modulos: ["SEGURIDAD_VIAL"],
  },
  {
    title: "Espacios Confinados",
    icon: "/icons/espacios-confinados.png",
    href: "#",
    external: false,
    modulos: ["ESPACIOS_CONFINADOS"],
  },
];

export default function Home() {
  const [permisos, setPermisos] = useState<PermisoModulo[]>([]);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    async function cargarDatosPortal() {
      const {
        data: permisosData,
        error: permisosError,
      } = await supabase.rpc("mis_permisos_portal");

      if (permisosError) {
        console.error(
          "Error cargando permisos:",
          permisosError
        );

        setPermisos([]);
      } else {
        setPermisos(
          (permisosData ?? []) as PermisoModulo[]
        );
      }

      const {
        data: perfilData,
        error: perfilError,
      } = await supabase.rpc("mi_perfil_portal");

      if (perfilError) {
        console.error(
          "Error cargando perfil:",
          perfilError
        );

        setEsAdmin(false);
      } else {
        const perfil =
          perfilData && perfilData.length > 0
            ? (perfilData[0] as PerfilPortal)
            : null;

        setEsAdmin(
          perfil?.activo === true &&
            perfil?.rol?.toUpperCase() === "ADMIN"
        );
      }

      setCargandoPermisos(false);
    }

    cargarDatosPortal();
  }, []);

  const programasVisibles = useMemo(() => {
    return programs.filter((program) => {
      if (program.modulos.length === 0) {
        return false;
      }

      return program.modulos.some((codigoModulo) =>
        permisos.some(
          (permiso) =>
            permiso.modulo === codigoModulo &&
            permiso.puede_ver === true
        )
      );
    });
  }, [permisos]);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-neutral-950 md:text-5xl">
              Portal HSEQ IA
            </h1>

            <div className="mt-3">
              <UserSessionBar />
            </div>

            {esAdmin && (
              <div className="mt-3">
                <a
                  href="/admin/usuarios"
                  className="inline-flex rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-800"
                >
                  Administrar usuarios
                </a>
              </div>
            )}
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

        {cargandoPermisos ? (
          <div className="py-16 text-center font-semibold text-neutral-500">
            Cargando módulos autorizados...
          </div>
        ) : programasVisibles.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-10 text-center">
            <h2 className="text-xl font-black text-neutral-900">
              Sin módulos asignados
            </h2>

            <p className="mt-2 text-neutral-600">
              Tu usuario no tiene módulos habilitados actualmente.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {programasVisibles.map((program) => (
              <a
                key={program.title}
                href={program.href}
                target={
                  program.external
                    ? "_blank"
                    : undefined
                }
                rel={
                  program.external
                    ? "noreferrer"
                    : undefined
                }
                aria-label={program.title}
                className="group rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-6">
                  <Image
                    src={program.icon}
                    alt={program.title}
                    width={300}
                    height={220}
                    className="h-44 w-auto object-contain transition duration-300 group-hover:scale-105"
                  />

                  <div className="rounded-xl border border-neutral-300 px-6 py-2 text-sm font-semibold text-neutral-900 transition group-hover:bg-neutral-950 group-hover:text-white">
                    Ingresar
                  </div>
                </div>
              </a>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}