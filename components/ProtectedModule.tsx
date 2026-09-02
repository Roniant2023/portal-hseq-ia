"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  modulo: string;
  children: React.ReactNode;
};

export default function ProtectedModule({
  modulo,
  children,
}: Props) {
  const router = useRouter();

  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    async function verificarAcceso() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase.rpc(
        "puede_acceder_modulo",
        {
          p_user_id: session.user.id,
          p_modulo: modulo,
        }
      );

      if (error || data !== true) {
        setAutorizado(false);
        setVerificando(false);
        return;
      }

      setAutorizado(true);
      setVerificando(false);
    }

    verificarAcceso();
  }, [modulo, router]);

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="font-semibold text-neutral-600">
          Verificando acceso...
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
            Acceso restringido
          </h1>

          <p className="mt-2 text-neutral-600">
            Tu usuario no tiene permisos para acceder a este módulo.
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