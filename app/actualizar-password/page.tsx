"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ActualizarPasswordPage() {
  const router = useRouter();

  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [verificando, setVerificando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [sesionValida, setSesionValida] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let montado = true;

    async function verificarRecuperacion() {
      try {
        setVerificando(true);
        setError("");

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!montado) return;

        if (error || !session) {
          setSesionValida(false);
          setError(
            "El enlace de recuperación no es válido o ya expiró."
          );
          return;
        }

        setSesionValida(true);
      } catch (err) {
        console.error(
          "Error verificando recuperación:",
          err
        );

        if (!montado) return;

        setSesionValida(false);
        setError(
          "No fue posible validar el enlace de recuperación."
        );
      } finally {
        if (montado) {
          setVerificando(false);
        }
      }
    }

    verificarRecuperacion();

    return () => {
      montado = false;
    };
  }, []);

  async function actualizarPassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nueva) {
      setError("Ingresa una nueva contraseña.");
      return;
    }

    if (nueva.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setGuardando(true);

      const { error } = await supabase.auth.updateUser({
        password: nueva,
      });

      if (error) {
        throw error;
      }

      setNueva("");
      setConfirmar("");

      setMensaje(
        "Tu contraseña fue actualizada correctamente."
      );

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login?estado=password_actualizada");
      }, 1200);
    } catch (err: any) {
      console.error(
        "Error actualizando contraseña:",
        err
      );

      setError(
        err?.message ||
          "No fue posible actualizar la contraseña."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="font-semibold text-neutral-600">
          Validando enlace de recuperación...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="text-sm font-bold uppercase tracking-wider text-green-700">
            Portal HSEQ
          </div>

          <h1 className="mt-2 text-3xl font-black text-neutral-950">
            Nueva contraseña
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Define una nueva contraseña para tu cuenta.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {mensaje}
          </div>
        )}

        {sesionValida ? (
          <form
            onSubmit={actualizarPassword}
            className="space-y-5"
          >
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
                required
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
                required
                disabled={guardando}
                autoComplete="new-password"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-xl bg-green-700 px-4 py-3 font-black text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando
                ? "Actualizando..."
                : "Guardar nueva contraseña"}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() =>
              router.push("/recuperar-password")
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 font-bold text-neutral-700 transition hover:bg-neutral-100"
          >
            Solicitar un nuevo enlace
          </button>
        )}
      </div>
    </main>
  );
}