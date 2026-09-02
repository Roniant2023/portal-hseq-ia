"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Usuario = {
  id: string;
  email: string;
  nombre: string | null;
  rol: string | null;
  activo: boolean | null;
};

export default function AdministracionUsuariosPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase.rpc(
        "listar_usuarios_portal"
      );

      if (error) {
        throw error;
      }

      setUsuarios((data ?? []) as Usuario[]);
    } catch (err: any) {
      setError(
        err?.message ||
          "No fue posible cargar los usuarios."
      );
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="font-semibold text-neutral-600">
          Cargando usuarios...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-wider text-green-700">
              Portal HSEQ
            </div>

            <h1 className="mt-2 text-3xl font-black text-neutral-950">
              Administración de usuarios
            </h1>

            <p className="mt-2 text-neutral-600">
              Gestiona usuarios, roles y permisos de acceso al Portal HSEQ.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 font-bold text-neutral-700"
          >
            ← Volver al Portal
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}

        {!error && (
          <>
            <div className="mb-5 text-sm font-semibold text-neutral-500">
              {usuarios.length} usuario
              {usuarios.length === 1 ? "" : "s"} registrado
              {usuarios.length === 1 ? "" : "s"}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-neutral-100 text-sm text-neutral-600">
                  <tr>
                    <th className="px-5 py-4">Nombre</th>
                    <th className="px-5 py-4">Correo</th>
                    <th className="px-5 py-4">Rol</th>
                    <th className="px-5 py-4">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="border-t border-neutral-100"
                    >
                      <td className="px-5 py-4 font-semibold text-neutral-900">
                        {usuario.nombre || "Sin nombre"}
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {usuario.email || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-bold ${
                            usuario.rol === "ADMIN"
                              ? "bg-green-100 text-green-800"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {usuario.rol || "SIN ROL"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {usuario.activo ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-800">
                            Inactivo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}