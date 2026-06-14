"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type TalkLibrary = {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
  status: string;
};

export default function ListadoBibliotecaCharlasPage() {
  const [talks, setTalks] = useState<TalkLibrary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTalks();
  }, []);

  const loadTalks = async () => {
    const { data, error } = await supabase
      .from("hseq_talk_library")
      .select("id, title, category, duration_minutes, status")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setTalks(data || []);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-black">
          Biblioteca de Charlas HSEQ
        </h1>

        <p className="mt-2 text-gray-600">
          Consulta de charlas maestras disponibles para programación mensual.
        </p>

        <div className="mt-6 flex justify-end">
          <Link
            href="/ambiental/charlas/biblioteca"
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Nueva charla
          </Link>
        </div>

        {loading ? (
          <div className="mt-8">Cargando biblioteca...</div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-black">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Título</th>
                  <th className="p-3 text-left">Categoría</th>
                  <th className="p-3 text-left">Duración</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Acción</th>
                </tr>
              </thead>

              <tbody>
                {talks.map((talk) => (
                  <tr key={talk.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-semibold">{talk.title}</td>
                    <td className="p-3">{talk.category}</td>
                    <td className="p-3">{talk.duration_minutes} min</td>
                    <td className="p-3">{talk.status}</td>
                    <td className="p-3">
                      <Link
                        href={`/ambiental/charlas/biblioteca/detalle/${talk.id}`}
                        className="rounded bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {talks.length === 0 && (
              <div className="p-4 text-sm text-gray-600">
                No hay charlas registradas en la biblioteca.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}