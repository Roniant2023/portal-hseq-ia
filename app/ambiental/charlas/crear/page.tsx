"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function CrearCharlaHSEQPage() {
  const [title, setTitle] = useState("");
  const [talkType, setTalkType] = useState("HSEQ");
  const [scheduledDate, setScheduledDate] = useState("");
  const [responsible, setResponsible] = useState("");
  const [location, setLocation] = useState("");
  const [objective, setObjective] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setMessage("");

    if (!title.trim() || !scheduledDate || !responsible.trim() || !location.trim()) {
      setMessage("Debe diligenciar tema, fecha, responsable y ubicación.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("hseq_talks").insert({
      title,
      talk_type: talkType,
      scheduled_date: scheduledDate,
      responsible,
      location,
      objective,
      content,
      status: "programada",
    });

    if (error) {
      console.error(error);
      setMessage("Error al guardar la charla.");
    } else {
      setMessage("Charla programada exitosamente.");
      setTitle("");
      setTalkType("HSEQ");
      setScheduledDate("");
      setResponsible("");
      setLocation("");
      setObjective("");
      setContent("");
    }

    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black">Programar charla HSEQ</h1>

        <p className="mt-2 text-gray-600">
          Registro inicial de charlas ambientales y de seguridad.
        </p>

        <section className="mt-8 rounded border border-black p-4">
          <h2 className="mb-4 text-base font-semibold">Datos de la charla</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                Tema de la charla
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Manejo de residuos peligrosos"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">Tipo</label>
              <select
                value={talkType}
                onChange={(e) => setTalkType(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              >
                <option value="HSEQ">HSEQ</option>
                <option value="Ambiental">Ambiental</option>
                <option value="Seguridad">Seguridad</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Fecha programada
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Responsable
              </label>
              <input
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Nombre del responsable"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Ubicación
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Base, locación o frente de trabajo"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                Objetivo
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Objetivo de la charla"
                className="min-h-24 w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                Contenido / puntos clave
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Temas principales que se tratarán en la charla"
                className="min-h-32 w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>
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
            {saving ? "Guardando..." : "Guardar charla"}
          </button>
        </div>
      </div>
    </main>
  );
}