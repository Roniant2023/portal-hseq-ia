"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type Execution = {
  id: string;
  created_at: string;
  executed_date: string;
  responsible: string;
  location: string;
  status: string;
  hseq_talk_attendance?: {
    id: string;
    score: number | null;
  }[];
  hseq_monthly_schedule?: {
    week_number: number;
    year: number;
    month: number;
    hseq_talk_library?: {
      title: string;
      category: string;
    } | null;
  } | null;
};

export default function ResultadosCharlasPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("hseq_talk_executions")
      .select(`
        id,
        created_at,
        executed_date,
        responsible,
        location,
        status,
        hseq_talk_attendance (
          id,
          score
        ),
        hseq_monthly_schedule (
          week_number,
          year,
          month,
          hseq_talk_library (
            title,
            category
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
  console.error(error);
} else {
  const normalizedData = (data || []).map((item: any) => {
    const schedule = Array.isArray(item.hseq_monthly_schedule)
      ? item.hseq_monthly_schedule[0] || null
      : item.hseq_monthly_schedule;

    const library = Array.isArray(schedule?.hseq_talk_library)
      ? schedule.hseq_talk_library[0] || null
      : schedule?.hseq_talk_library;

    return {
      ...item,
      hseq_talk_attendance: Array.isArray(item.hseq_talk_attendance)
        ? item.hseq_talk_attendance
        : [],

      hseq_monthly_schedule: schedule
        ? {
            ...schedule,
            hseq_talk_library: library,
          }
        : null,
    };
  });

  setExecutions(normalizedData as Execution[]);
}

    setLoading(false);
  };

  const filteredExecutions = executions.filter((execution) =>
    execution.location
      ?.toLowerCase()
      .includes(locationFilter.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black">
          Resultados de Charlas HSEQ
        </h1>

        <p className="mt-2 text-gray-600">
          Consulta de charlas ejecutadas por ubicación, responsable y resultado.
        </p>

        <section className="mt-8 rounded border border-black p-4">
          <label className="mb-1 block text-xs text-gray-600">
            Filtrar por ubicación
          </label>

          <input
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Ej: Palermo, Palogrande, Apiay"
            className="w-full rounded border border-black px-3 py-2 text-sm"
          />
        </section>

        {loading ? (
          <div className="mt-8">Cargando resultados...</div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-black">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Charla</th>
                  <th className="p-3 text-left">Semana</th>
                  <th className="p-3 text-left">Ubicación</th>
                  <th className="p-3 text-left">Responsable</th>
                  <th className="p-3 text-left">Asistentes</th>
                  <th className="p-3 text-left">Promedio</th>
                  <th className="p-3 text-left">Estado</th>
<th className="p-3 text-left">Acción</th>
                </tr>
              </thead>

              <tbody>
                {filteredExecutions.map((execution) => {
                  const attendance =
                    execution.hseq_talk_attendance || [];

                  const scores = attendance
                    .map((item) => item.score)
                    .filter((score): score is number => score !== null);

                  const average =
                    scores.length > 0
                      ? Math.round(
                          scores.reduce((acc, score) => acc + score, 0) /
                            scores.length
                        )
                      : null;

                  return (
                    <tr key={execution.id} className="border-t">
                      <td className="p-3">
  <Link
    href={`/ambiental/charlas/resultados/${execution.id}`}
    className="rounded bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
  >
    Ver detalle
  </Link>
</td>

                      <td className="p-3 font-semibold">
                        {
                          execution.hseq_monthly_schedule
                            ?.hseq_talk_library?.title
                        }
                      </td>

                      <td className="p-3">
                        Semana{" "}
                        {
                          execution.hseq_monthly_schedule
                            ?.week_number
                        }
                      </td>

                      <td className="p-3">
                        {execution.location}
                      </td>

                      <td className="p-3">
                        {execution.responsible}
                      </td>

                      <td className="p-3">
                        {attendance.length}
                      </td>

                      <td className="p-3">
                        {average !== null ? `${average}%` : "-"}
                      </td>

                      <td className="p-3">
                        {execution.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredExecutions.length === 0 && (
              <div className="p-4 text-sm text-gray-600">
                No hay resultados para mostrar.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}