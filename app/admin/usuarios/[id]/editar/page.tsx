"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UsuarioEditable = {
  id: string;
  email: string;
  nombre: string | null;
  cargo: string | null;
  rol: string | null;
  activo: boolean | null;
};

export default function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [usuario, setUsuario] = useState<UsuarioEditable | null>(null);

  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [rol, setRol] = useState("USUARIO");
  const [activo, setActivo] = useState(true);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarUsuario();
  }, [id]);

  async function cargarUsuario() {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const { data, error } = await supabase.rpc(
        "admin_obtener_usuario",
        {
          target_user_id: id,
        }
      );

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setError("No se encontró el usuario.");
        return;
      }

      const u = data[0] as UsuarioEditable;

      setUsuario(u);
      setNombre(u.nombre ?? "");
      setCargo(u.cargo ?? "");
      setRol(u.rol ?? "USUARIO");
      setActivo(u.activo === true);
    } catch (err: any) {
      console.error("Error cargando usuario:", err);

      setError(
        err?.message ||
          "No fue posible cargar la información del usuario."
      );
    } finally {
      setCargando(false);
    }
  }

  async function guardarCambios(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("Ingresa el nombre del usuario.");
      return;
    }

    try {
      setGuardando(true);

      const { error } = await supabase.rpc(
        "admin_actualizar_usuario",
        {
          target_user_id: id,
          target_nombre: nombre.trim(),
          target_cargo: cargo.trim() || null,
          target_rol: rol,
          target_activo: activo,
        }
      );

      if (error) {
        throw error;
      }

      setMensaje("Usuario actualizado correctamente.");

      setUsuario((actual) =>
        actual
          ? {
              ...actual,
              nombre: nombre.trim(),
              cargo: cargo.trim() || null,
              rol,
              activo,
            }
          : actual
      );
    } catch (err: any) {
      console.error("Error actualizando usuario:", err);

      setError(
        err?.message ||
          "No fue posible actualizar el usuario."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="font-semibold text-neutral-600">
          Cargando usuario...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-wider text-green-700">
              Portal HSEQ
            </div>

            <h1 className="mt-2 text-3xl font-black text-neutral-950">
              Editar usuario
            </h1>

            <p className="mt-2 text-neutral-600">
              Modifica los datos generales y el estado de acceso del usuario.
            </p>
          </div>

          <button
            type="button"
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

        {usuario && (
          <form
            onSubmit={guardarCambios}
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-neutral-700">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  value={usuario.email}
                  disabled
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-500"
                />

                <p className="mt-2 text-xs text-neutral-400">
                  El correo no se modifica desde esta pantalla.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-neutral-700">
                  Nombre completo
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={guardando}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-neutral-700">
                  Cargo
                </label>

                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  disabled={guardando}
                  placeholder="Ej. Supervisor HSEQ"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-neutral-700">
                  Rol
                </label>

                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  disabled={guardando}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
                >
                  <option value="USUARIO">USUARIO</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-neutral-700">
                  Estado
                </label>

                <label className="flex min-h-[50px] cursor-pointer items-center gap-3 rounded-xl border border-neutral-300 px-4">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    disabled={guardando}
                    className="h-5 w-5 accent-green-700"
                  />

                  <span className="font-semibold text-neutral-700">
                    Usuario activo
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/usuarios")}
                disabled={guardando}
                className="rounded-xl border border-neutral-300 bg-white px-6 py-3 font-bold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="rounded-xl bg-green-700 px-7 py-3 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}