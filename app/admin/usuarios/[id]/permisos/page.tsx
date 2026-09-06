"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Permiso = {
  modulo: string;
  nombre: string;
  ruta: string | null;
  puede_ver: boolean;
  puede_editar: boolean;
};

export default function PermisosUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarPermisos();
  }, [id]);

  async function cargarPermisos() {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const { data, error } = await supabase.rpc(
        "admin_permisos_usuario",
        {
          target_user_id: id,
        }
      );

      if (error) {
        throw error;
      }

      setPermisos((data ?? []) as Permiso[]);
    } catch (err: any) {
      console.error("Error cargando permisos:", err);

      setError(
        err?.message ||
          "No fue posible cargar los permisos del usuario."
      );
    } finally {
      setCargando(false);
    }
  }

  function cambiarPermiso(
    modulo: string,
    campo: "puede_ver" | "puede_editar",
    valor: boolean
  ) {
    setPermisos((actuales) =>
      actuales.map((permiso) => {
        if (permiso.modulo !== modulo) {
          return permiso;
        }

        // Si puede editar, necesariamente también debe poder ver.
        if (campo === "puede_editar" && valor) {
          return {
            ...permiso,
            puede_ver: true,
            puede_editar: true,
          };
        }

        // Si quitamos "Ver", también quitamos "Editar".
        if (campo === "puede_ver" && !valor) {
          return {
            ...permiso,
            puede_ver: false,
            puede_editar: false,
          };
        }

        return {
          ...permiso,
          [campo]: valor,
        };
      })
    );
  }

  async function guardarPermisos() {
    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      for (const permiso of permisos) {
        const { error } = await supabase.rpc(
          "admin_guardar_permiso_usuario",
          {
            target_user_id: id,
            target_modulo: permiso.modulo,
            target_puede_ver: permiso.puede_ver,
            target_puede_editar: permiso.puede_editar,
          }
        );

        if (error) {
          throw error;
        }
      }

      setMensaje("Permisos guardados correctamente.");
    } catch (err: any) {
      console.error("Error guardando permisos:", err);

      setError(
        err?.message ||
          "No fue posible guardar los permisos."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="font-semibold text-neutral-600">
          Cargando permisos...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-wider text-green-700">
              Portal HSEQ
            </div>

            <h1 className="mt-2 text-3xl font-black text-neutral-950">
              Permisos de usuario
            </h1>

            <p className="mt-2 text-neutral-600">
              Define los módulos que este usuario puede consultar o
              modificar.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/usuarios")}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 font-bold text-neutral-700 transition hover:bg-neutral-100"
          >
            ← Volver a usuarios
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 font-semibold text-green-800">
            {mensaje}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-neutral-100 text-sm text-neutral-600">
              <tr>
                <th className="px-6 py-4">
                  Módulo
                </th>

                <th className="px-6 py-4 text-center">
                  Ver
                </th>

                <th className="px-6 py-4 text-center">
                  Editar
                </th>
              </tr>
            </thead>

            <tbody>
              {permisos.map((permiso) => (
                <tr
                  key={permiso.modulo}
                  className="border-t border-neutral-100"
                >
                  <td className="px-6 py-5">
                    <div className="font-bold text-neutral-900">
                      {permiso.nombre}
                    </div>

                    <div className="mt-1 text-xs font-semibold text-neutral-400">
                      {permiso.modulo}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <input
                      type="checkbox"
                      checked={permiso.puede_ver}
                      onChange={(e) =>
                        cambiarPermiso(
                          permiso.modulo,
                          "puede_ver",
                          e.target.checked
                        )
                      }
                      className="h-5 w-5 cursor-pointer accent-green-700"
                    />
                  </td>

                  <td className="px-6 py-5 text-center">
                    <input
                      type="checkbox"
                      checked={permiso.puede_editar}
                      onChange={(e) =>
                        cambiarPermiso(
                          permiso.modulo,
                          "puede_editar",
                          e.target.checked
                        )
                      }
                      className="h-5 w-5 cursor-pointer accent-green-700"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {permisos.length === 0 && !error && (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
            No se encontraron módulos disponibles.
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={guardarPermisos}
            disabled={guardando || permisos.length === 0}
            className="rounded-xl bg-green-700 px-7 py-3 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </main>
  );
}