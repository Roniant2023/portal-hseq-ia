"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type ScheduledTalk = {
  id: string;
  year: number;
  month: number;
  week_number: number;
  status: string;
  hseq_talk_library: {
    id: string;
    title: string;
    category: string;
    objective: string;
    duration_minutes: number;
    guide_content: string;
    key_points: string;
    final_message: string;
  } | null;
};

export default function EjecutarCharlaPage() {
  const [talks, setTalks] = useState<ScheduledTalk[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  useEffect(() => {
    loadScheduledTalks();
  }, []);

  const loadScheduledTalks = async () => {
    const { data, error } = await supabase
      .from("hseq_monthly_schedule")
      .select(`
        id,
        year,
        month,
        week_number,
        status,
        hseq_talk_library (
          id,
          title,
          category,
          objective,
          duration_minutes,
          guide_content,
          key_points,
          final_message
        )
      `)
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .order("week_number", { ascending: true });

    if (error) {
  console.error(error);
} else {
  const normalizedData = (data || []).map((item: any) => ({
    ...item,
    hseq_talk_library: Array.isArray(item.hseq_talk_library)
      ? item.hseq_talk_library[0] || null
      : item.hseq_talk_library,
  }));

  setTalks(normalizedData as ScheduledTalk[]);
}
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-black">Ejecutar charla HSEQ</h1>

        <p className="mt-2 text-gray-600">
          Charlas programadas para el mes actual.
        </p>

        {loading ? (
          <div className="mt-8">Cargando charlas programadas...</div>
        ) : (
          <section className="mt-8 grid gap-6">
            {talks.map((talk) => (
              <div
                key={talk.id}
                className="rounded-xl border border-black p-4"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Semana {talk.week_number}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {talk.hseq_talk_library?.title}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                      {talk.hseq_talk_library?.category} ·{" "}
                      {talk.hseq_talk_library?.duration_minutes} min
                    </p>
                  </div>

                  <span className="rounded bg-green-700 px-3 py-1 text-xs font-semibold text-white">
                    {talk.status}
                  </span>
                </div>

                <div className="mt-4 rounded border border-gray-300 bg-gray-50 p-4">
                  <h3 className="font-semibold">Objetivo</h3>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {talk.hseq_talk_library?.objective}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded border border-gray-300 p-4">
                    <h3 className="font-semibold">Contenido guía</h3>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {talk.hseq_talk_library?.guide_content}
                    </p>
                  </div>

                  <div className="rounded border border-gray-300 p-4">
                    <h3 className="font-semibold">Puntos clave</h3>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {talk.hseq_talk_library?.key_points}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded border border-black bg-black p-4 text-white">
                  <h3 className="font-semibold">Mensaje final</h3>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {talk.hseq_talk_library?.final_message}
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Link
  href={`/ambiental/charlas/ejecutar/${talk.id}`}
  className="rounded bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
>
  Iniciar charla
</Link>
                </div>
              </div>
            ))}

            {talks.length === 0 && (
              <div className="rounded border border-black p-4 text-sm text-gray-600">
                No hay charlas programadas para este mes.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}