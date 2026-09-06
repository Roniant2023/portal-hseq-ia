"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Perfil = {
  nombre: string | null;
  rol: string | null;
  activo: boolean | null;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    let montado = true;

    async function verificarAdmin() {
      try {
        setVerificando(true);
        setAutorizado(false);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!montado) return;

        if (sessionError || !session) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase.rpc(
          "mi_perfil_portal"
        );

        if (!montado) return;

        if (error) {
          console.error(
            "Error verificando perfil administrativo:",
            error
          );

          setAutorizado(false);
          setVerificando(false);
          return;
        }

        const perfil =
          data && data.length > 0
            ? (data[0] as Perfil)
            : null;

        const esAdmin =
          perfil?.activo === true &&
          perfil?.rol?.toUpperCase() === "ADMIN";

        setAutorizado(esAdmin);
        setVerificando(false);
      } catch (error) {
        console.error(
          "Error verificando acceso administrativo:",
          error
        );

        if (!montado) return;

        setAutorizado(false);
        setVerificando(false);
      }
    }

    verificarAdmin();

    return () => {
      montado = false;
    };
  }, [router]);

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="font-semibold text-neutral-600">
          Verificando acceso administrativo...
        </p>
      </main>
    );
  }

  if (!autorizado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <div className="max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            🔒
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Acceso administrativo restringido
          </h1>

          <p className="mt-2 text-neutral-600">
            Tu usuario no tiene permisos de administrador.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
          >
            Volver al Portal HSEQ
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}