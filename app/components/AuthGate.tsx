"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const esRutaPublica = pathname === "/login";

  const [verificando, setVerificando] = useState(!esRutaPublica);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    if (esRutaPublica) {
      setVerificando(false);
      setAutenticado(false);
      return;
    }

    // Cada vez que cambia la ruta protegida,
    // volvemos a comprobar la sesión.
    setVerificando(true);
    setAutenticado(false);

    let montado = true;

    async function verificar() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!montado) return;

      if (error || !session) {
        setAutenticado(false);
        setVerificando(false);
        router.replace("/login");
        return;
      }

      setAutenticado(true);
      setVerificando(false);
    }

    verificar();

    return () => {
      montado = false;
    };
  }, [pathname, esRutaPublica, router]);

  // /login siempre puede mostrarse.
  if (esRutaPublica) {
    return <>{children}</>;
  }

  // Nunca mostramos el contenido protegido mientras
  // Supabase está comprobando la sesión.
  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="font-semibold text-neutral-600">
          Verificando acceso al Portal HSEQ...
        </p>
      </main>
    );
  }

  // Sin sesión no renderizamos absolutamente nada
  // mientras Next.js redirige al login.
  if (!autenticado) {
    return null;
  }

  return <>{children}</>;
}