"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    async function verificarAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("perfiles_usuarios")
        .select("rol, activo")
        .eq("id", session.user.id)
        .single();

      if (
        error ||
        !data ||
        data.activo !== true ||
        data.rol?.toUpperCase() !== "ADMIN"
      ) {
        setAutorizado(false);
        setVerificando(false);
        return;
      }

      setAutorizado(true);
      setVerificando(false);
    }

    verificarAdmin();
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
          <div className="text-5xl">🔒</div>

          <h1 className="mt-4 text-2xl font-black">
            Acceso administrativo restringido
          </h1>

          <p className="mt-2 text-neutral-600">
            Tu usuario no tiene permisos de administrador.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-bold text-white"
          >
            Volver al Portal HSEQ
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}