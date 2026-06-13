"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type Inspection = {
  id: string;
  created_at: string;
  inspection_date: string;
  inspection_time: string;
  inspector: string;
  location: string;
  observations: string;
  environmental_inspection_photos?: {
    id: string;
  }[];
};

export default function ListadoInspeccionesAmbientalesPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    const { data, error } = await supabase
      .from("environmental_inspections")
      .select(`
        *,
        environmental_inspection_photos (
          id
        )
      `)
      .order("inspection_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setInspections(data || []);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black">
          Consultar Registros Fotográficos ICA
        </h1>

        <p className="mt-2 text-gray-600">
          Historial de inspecciones ambientales registradas.
        </p>

        {loading ? (
          <div className="mt-8">Cargando registros...</div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Fecha</th>
<th className="p-3 text-left">Hora</th>
<th className="p-3 text-left">Inspector</th>
<th className="p-3 text-left">Ubicación</th>
<th className="p-3 text-left">Evidencias</th>
<th className="p-3 text-left">Acción</th>
                </tr>
              </thead>

              <tbody>
                {inspections.map((inspection) => (
                  <tr key={inspection.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{inspection.inspection_date}</td>
                    <td className="p-3">{inspection.inspection_time}</td>
                    <td className="p-3">{inspection.inspector}</td>
                    <td className="p-3">{inspection.location}</td>
                   <td className="p-3">
  {inspection.environmental_inspection_photos?.length || 0}
</td>

<td className="p-3">
  <Link
    href={`/ambiental/inspecciones/detalle/${inspection.id}`}
    className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 inline-block"
  >
    Ver detalle
  </Link>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}