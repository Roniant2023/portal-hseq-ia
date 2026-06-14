"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type TalkLibrary = {
  id: string;
  title: string;
  category: string;
};

export default function ProgramacionCharlasPage() {
  const [talks, setTalks] = useState<TalkLibrary[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [weeks, setWeeks] = useState({
    1: "",
    2: "",
    3: "",
    4: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTalks();
  }, []);

  const loadTalks = async () => {
    const { data, error } = await supabase
      .from("hseq_talk_library")
      .select("id, title, category")
      .eq("status", "activa")
      .order("title", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setTalks(data || []);
    }
  };

  const handleWeekChange = (week: 1 | 2 | 3 | 4, value: string) => {
    setWeeks((prev) => ({
      ...prev,
      [week]: value,
    }));
  };

  const handleSave = async () => {
    setMessage("");

    if (!weeks[1] || !weeks[2] || !weeks[3] || !weeks[4]) {
      setMessage("Debe seleccionar una charla para cada una de las 4 semanas.");
      return;
    }

    setSaving(true);

    await supabase
      .from("hseq_monthly_schedule")
      .delete()
      .eq("year", year)
      .eq("month", month);

    const records = [1, 2, 3, 4].map((week) => ({
      year,
      month,
      week_number: week,
      talk_library_id: weeks[week as 1 | 2 | 3 | 4],
      status: "programada",
    }));

    const { error } = await supabase
      .from("hseq_monthly_schedule")
      .insert(records);

    if (error) {
      console.error(error);
      setMessage("Error al guardar la programación mensual.");
    } else {
      setMessage("Programación mensual guardada exitosamente.");
    }

    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black">
          Programación mensual de charlas
        </h1>

        <p className="mt-2 text-gray-600">
          Selecciona una charla semanal para garantizar 4 charlas al mes.
        </p>

        <section className="mt-8 rounded border border-black p-4">
          <h2 className="mb-4 text-base font-semibold">
            Mes de programación
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-600">Año</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">Mes</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              >
                <option value={1}>Enero</option>
                <option value={2}>Febrero</option>
                <option value={3}>Marzo</option>
                <option value={4}>Abril</option>
                <option value={5}>Mayo</option>
                <option value={6}>Junio</option>
                <option value={7}>Julio</option>
                <option value={8}>Agosto</option>
                <option value={9}>Septiembre</option>
                <option value={10}>Octubre</option>
                <option value={11}>Noviembre</option>
                <option value={12}>Diciembre</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded border border-black p-4">
          <h2 className="mb-4 text-base font-semibold">
            Charlas por semana
          </h2>

          <div className="grid gap-4">
            {[1, 2, 3, 4].map((week) => (
              <div key={week}>
                <label className="mb-1 block text-xs text-gray-600">
                  Semana {week}
                </label>

                <select
                  value={weeks[week as 1 | 2 | 3 | 4]}
                  onChange={(e) =>
                    handleWeekChange(week as 1 | 2 | 3 | 4, e.target.value)
                  }
                  className="w-full rounded border border-black px-3 py-2 text-sm"
                >
                  <option value="">Seleccione una charla</option>

                  {talks.map((talk) => (
                    <option key={talk.id} value={talk.id}>
                      {talk.title} — {talk.category}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded border border-black bg-gray-50 px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar programación"}
          </button>
        </div>
      </div>
    </main>
  );
}