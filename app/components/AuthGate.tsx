"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PerfilPortal = {
  nombre: string | null;
  rol: string | null;
  activo: boolean | null;
};

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const esRutaPublica = [
  "/login",
  "/recuperar-password",
  "/actualizar-password",
].includes(pathname);

  const [verificando, setVerificando] = useState(
    !esRutaPublica
  );
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    if (esRutaPublica) {
      setVerificando(false);
      setAutenticado(false);
      return;
    }

    let montado = true;

    async function verificarAcceso() {
      setVerificando(true);
      setAutenticado(false);

      try {
        // 1. Comprobar sesión de Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!montado) return;

        if (sessionError || !session) {
          setVerificando(false);
          router.replace("/login");
          return;
        }

        // 2. Consultar el perfil real del usuario
        const { data, error: perfilError } =
          await supabase.rpc("mi_perfil_portal");

        if (!montado) return;

        if (
          perfilError ||
          !data ||
          data.length === 0
        ) {
          await supabase.auth.signOut();

          if (!montado) return;

          setVerificando(false);
          router.replace("/login?estado=sin_perfil");
          return;
        }

        const perfil = data[0] as PerfilPortal;

        // 3. Bloquear usuarios inactivos
        if (perfil.activo !== true) {
          await supabase.auth.signOut();

          if (!montado) return;

          setAutenticado(false);
          setVerificando(false);

          router.replace("/login?estado=inactivo");
          return;
        }

        // 4. Usuario autenticado y activo
        setAutenticado(true);
        setVerificando(false);
      } catch (error) {
        console.error(
          "Error verificando acceso al Portal HSEQ:",
          error
        );

        if (!montado) return;

        setAutenticado(false);
        setVerificando(false);

        router.replace("/login");
      }
    }

    verificarAcceso();

    return () => {
      montado = false;
    };
  }, [pathname, esRutaPublica, router]);

  if (esRutaPublica) {
    return <>{children}</>;
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="font-semibold text-neutral-600">
          Verificando acceso al Portal HSEQ...
        </p>
      </main>
    );
  }

  if (!autenticado) {
    return null;
  }

  return <>{children}</>;
}