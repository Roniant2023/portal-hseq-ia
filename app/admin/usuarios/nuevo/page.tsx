"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NuevoUsuarioPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [cargo, setCargo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] =
    useState("");
  const [rol, setRol] = useState("USUARIO");
  const [activo, setActivo] = useState(true);

  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function crearUsuario(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!nombre.trim()) {
      setError("Ingresa el nombre del usuario.");
      return;
    }

    if (!correo.trim()) {
      setError("Ingresa el correo electrónico.");
      return;
    }

    if (!contrasena) {
      setError("Ingresa una contraseña inicial.");
      return;
    }

    if (contrasena.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setGuardando(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError(
          "La sesión no es válida. Inicia sesión nuevamente."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/usuarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            nombre: nombre.trim(),
            correo: correo.trim(),
            cargo: cargo.trim(),
            contrasena,
            rol,
            activo,
          }),
        }
      );

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado?.error ||
            "No fue posible crear el usuario."
        );
      }

      if (!resultado?.usuario?.id) {
        throw new Error(
          "El usuario fue creado, pero no se recibió su identificador."
        );
      }

      router.push(
        `/admin/usuarios/${resultado.usuario.id}/permisos`
      );
    } catch (err: any) {
      console.error("Error creando usuario:", err);

      setError(
        err?.message ||
          "No fue posible crear el usuario."
      );
    } finally {
      setGuardando(false);
    }
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
              Crear usuario
            </h1>

            <p className="mt-2 text-neutral-600">
              Registra un nuevo usuario autorizado para
              acceder al Portal HSEQ.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/usuarios")
            }
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 font-bold text-neutral-700 transition hover:bg-neutral-100"
          >
            ← Volver a usuarios
          </button>
        </div>

        <form
          onSubmit={crearUsuario}
          className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-neutral-700">
                Nombre completo
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
                placeholder="Nombre del usuario"
                disabled={guardando}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-neutral-700">
                Correo electrónico
              </label>

              <input
                type="email"
                value={correo}
                onChange={(e) =>
                  setCorreo(e.target.value)
                }
                placeholder="usuario@empresa.com"
                autoComplete="off"
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
                onChange={(e) =>
                  setCargo(e.target.value)
                }
                placeholder="Ej. Supervisor HSEQ"
                disabled={guardando}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              />

              <p className="mt-2 text-xs text-neutral-400">
                Opcional.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700">
                Contraseña inicial
              </label>

              <input
                type="password"
                value={contrasena}
                onChange={(e) =>
                  setContrasena(e.target.value)
                }
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                disabled={guardando}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700">
                Confirmar contraseña
              </label>

              <input
                type="password"
                value={confirmarContrasena}
                onChange={(e) =>
                  setConfirmarContrasena(
                    e.target.value
                  )
                }
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                disabled={guardando}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700">
                Rol
              </label>

              <select
                value={rol}
                onChange={(e) =>
                  setRol(e.target.value)
                }
                disabled={guardando}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              >
                <option value="USUARIO">
                  USUARIO
                </option>

                <option value="ADMIN">
                  ADMIN
                </option>
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
                  onChange={(e) =>
                    setActivo(e.target.checked)
                  }
                  disabled={guardando}
                  className="h-5 w-5 accent-green-700"
                />

                <span className="font-semibold text-neutral-700">
                  Usuario activo
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/admin/usuarios")
              }
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
                ? "Creando usuario..."
                : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}