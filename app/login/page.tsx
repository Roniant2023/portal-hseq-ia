"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

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