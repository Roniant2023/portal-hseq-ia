"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RecuperarPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function enviarRecuperacion(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    const correo = email.trim().toLowerCase();

    if (!correo) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    try {
      setEnviando(true);

      const redirectTo = `${window.location.origin}/actualizar-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          correo,
          {
            redirectTo,
          }
        );

      if (error) {
        throw error;
      }

      setMensaje(
        "Si el correo corresponde a una cuenta registrada, recibirás un enlace para restablecer tu contraseña."
      );

      setEmail("");
    } catch (err: any) {
      console.error(
        "Error enviando recuperación de contraseña:",
        err
      );

      setError(
        err?.message ||
          "No fue posible enviar el correo de recuperación."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="text-sm font-bold uppercase tracking-wider text-green-700">
            Portal HSEQ
          </div>

          <h1 className="mt-2 text-3xl font-black text-neutral-950">
            Recuperar contraseña
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Ingresa el correo asociado a tu cuenta.
            Te enviaremos un enlace para establecer una
            nueva contraseña.
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

        <form
          onSubmit={enviarRecuperacion}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700">
              Correo electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              disabled={enviando}
              autoComplete="email"
              placeholder="usuario@empresa.com"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-green-700 disabled:bg-neutral-100"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-green-700 px-4 py-3 font-black text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Enviando..."
              : "Enviar enlace de recuperación"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            disabled={enviando}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 font-bold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
          >
            ← Volver a iniciar sesión
          </button>
        </form>
      </div>
    </main>
  );
}