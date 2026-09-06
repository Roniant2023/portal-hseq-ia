"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CambiarPasswordPage() {
  const router = useRouter();

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cambiarPassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!actual) {
      setError("Ingresa tu contraseña actual.");
      return;
    }

    if (!nueva) {
      setError("Ingresa una nueva contraseña.");
      return;
    }

    if (nueva.length < 8) {
      setError(
        "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (nueva !== confirmar) {
      setError("Las nuevas contraseñas no coinciden.");
      return;
    }

    if (actual === nueva) {
      setError(
        "La nueva contraseña debe ser diferente de la contraseña actual."
      );
      return;
    }

    try {
      setGuardando(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        throw new Error(
          "No fue posible identificar tu sesión."
        );
      }

      // Verificar primero la contraseña actual
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: actual,
        });

      if (loginError) {
        setError("La contraseña actual no es correcta.");
        return;
      }

      // Cambiar contraseña del usuario autenticado
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: nueva,
        });

      if (updateError) {
        throw updateError;
      }

      setActual("");
      setNueva("");
      setConfirmar("");

      setMensaje(
        "Tu contraseña fue actualizada correctamente."
      );
    } catch (err: any) {
      console.error("Error cambiando contraseña:", err);

      setError(
        err?.message ||
          "No fue posible cambiar la contraseña."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-wider text-green-700">
              Portal HSEQ
            </div>

            <h1 className="mt-2 text-3xl font-black text-neutral-950">
              Cambiar mi contraseña
            </h1>

            <p className="mt-2 text-neutral-600">
              Actualiza la contraseña de tu cuenta de acceso al Portal HSEQ.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 font-bold text-neutral-700 transition hover:bg-neutral-100"
          >
            ← Volver al Portal
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

        <form
          onSubmit={cambiarPassword}
          className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700">
                Contraseña actual
              </label>

              <input
                type="password"
                value={actual}
                onChange={(e) =>
                  setActual(e.target.value)
                }
                disabled={guardando}
                autoComplete="current-password"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700">
                Nueva contraseña
              </label>

              <input
                type="password"
                value={nueva}
                onChange={(e) =>
                  setNueva(e.target.value)
                }
                disabled={guardando}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-neutral-700">
                Confirmar nueva contraseña
              </label>

              <input
                type="password"
                value={confirmar}
                onChange={(e) =>
                  setConfirmar(e.target.value)
                }
                disabled={guardando}
                autoComplete="new-password"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-green-700 px-7 py-3 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando
                ? "Actualizando..."
                : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}