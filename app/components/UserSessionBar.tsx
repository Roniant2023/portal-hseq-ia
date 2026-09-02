"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Perfil = {
  nombre: string | null;
  rol: string | null;
  activo: boolean | null;
};

export default function UserSessionBar() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    async function cargarUsuario() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      setEmail(session.user.email ?? "");

      const { data, error } = await supabase.rpc("mi_perfil_portal");

      if (error) {
        console.error("Error cargando perfil:", error);
        return;
      }

      if (data && data.length > 0) {
        setPerfil(data[0]);
      }
    }

    cargarUsuario();
  }, []);

  async function cerrarSesion() {
    try {
      setCerrando(true);

      await supabase.auth.signOut();

      router.replace("/login");
      router.refresh();
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm font-bold text-neutral-900">
          {perfil?.nombre || email}
        </div>

        <div className="text-xs font-semibold text-neutral-500">
          {perfil?.rol || "Usuario"}
        </div>
      </div>

      <button
        onClick={cerrarSesion}
        disabled={cerrando}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
      >
        {cerrando ? "Cerrando..." : "Cerrar sesión"}
      </button>
    </div>
  );
}