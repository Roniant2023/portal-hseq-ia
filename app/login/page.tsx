"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const estado = searchParams.get("estado");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCargando(true);
      setError("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(
        err?.message || "No fue posible iniciar sesión."
      );
    } finally {
      setCargando(false);
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
            Iniciar sesión
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Ingresa con tu cuenta autorizada para acceder al portal HSEQ EIES.
          </p>
        </div>

        {estado === "inactivo" && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="font-black text-amber-900">
              Usuario inactivo
            </div>

            <p className="mt-1 text-sm font-medium text-amber-800">
              Tu acceso al Portal HSEQ se encuentra deshabilitado.
              Contacta al administrador para solicitar la reactivación.
            </p>
          </div>
        )}

        {estado === "sin_perfil" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="font-black text-red-800">
              Usuario sin perfil autorizado
            </div>

            <p className="mt-1 text-sm font-medium text-red-700">
              Tu cuenta no tiene un perfil habilitado en el Portal HSEQ.
              Contacta al administrador.
            </p>
          </div>
        )}

{estado === "password_actualizada" && (
  <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
    <div className="font-black text-green-900">
      Contraseña actualizada
    </div>

    <p className="mt-1 text-sm font-medium text-green-800">
      Tu contraseña fue actualizada correctamente.
      Ya puedes iniciar sesión con la nueva contraseña.
    </p>
  </div>
)}
        <form onSubmit={iniciarSesion} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700">
              Correo electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-green-600"
              placeholder="usuario@empresa.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-green-600"
              placeholder="••••••••"
            />
          </div>
<button
  type="button"
  onClick={() => router.push("/recuperar-password")}
  className="w-full text-center text-sm font-bold text-green-700 transition hover:text-green-800"
>
  ¿Olvidaste tu contraseña?
</button>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-green-700 px-4 py-3 font-black text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}