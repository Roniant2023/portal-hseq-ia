"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function BibliotecaCharlasPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("HSEQ");
  const [objective, setObjective] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("10");
  const [guideContent, setGuideContent] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [finalMessage, setFinalMessage] = useState("");
const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setMessage("");

    if (!title.trim() || !objective.trim()) {
      setMessage("Debe diligenciar título y objetivo.");
      return;
    }
setSaving(true);

let flyerUrl: string | null = null;

if (flyerFile) {
  const fileExt = flyerFile.name.split(".").pop();
  const fileName = `flyers/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("hseq-talk-materials")
    .upload(fileName, flyerFile);

  if (uploadError) {
    console.error(uploadError);
    setMessage("Error cargando el flyer.");
    setSaving(false);
    return;
  }

  const { data } = supabase.storage
    .from("hseq-talk-materials")
    .getPublicUrl(fileName);

  flyerUrl = data.publicUrl;
}

const { error } = await supabase.from("hseq_talk_library").insert({
      title,
      category,
      objective,
      duration_minutes: Number(durationMinutes),
      guide_content: guideContent,
      key_points: keyPoints,
      final_message: finalMessage,
flyer_url: flyerUrl,
status: "activa",
    });

  if (error) {
  console.error(error);
  setMessage("Error al guardar la charla en biblioteca.");
} else {
  setMessage("Charla guardada exitosamente en la biblioteca.");
  setTitle("");
  setCategory("HSEQ");
  setObjective("");
  setDurationMinutes("10");
  setGuideContent("");
  setKeyPoints("");
  setFinalMessage("");
  setFlyerFile(null);
}

    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black">Biblioteca de Charlas HSEQ</h1>

        <p className="mt-2 text-gray-600">
          Carga de charlas maestras para programación mensual y ejecución en campo.
        </p>

        <section className="mt-8 rounded border border-black p-4">
          <h2 className="mb-4 text-base font-semibold">Datos de la charla maestra</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                Título de la charla
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Segregación de residuos"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              >
                <option value="HSEQ">HSEQ</option>
                <option value="Ambiental">Ambiental</option>
                <option value="Seguridad">Seguridad</option>
                <option value="Salud">Salud</option>
                <option value="Seguridad vial">Seguridad vial</option>
                <option value="Control de trabajo">Control de trabajo</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Duración estimada
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">Objetivo</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Objetivo de aprendizaje o toma de conciencia"
                className="min-h-24 w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

          <div className="md:col-span-2">
  <label className="mb-1 block text-xs text-gray-600">
    Contenido guía
  </label>

  <textarea
    value={guideContent}
    onChange={(e) => setGuideContent(e.target.value)}
    placeholder="Texto base que usará el expositor para orientar la charla"
    className="min-h-32 w-full rounded border border-black px-3 py-2 text-sm"
  />
</div>

<div className="md:col-span-2">
  <label className="mb-1 block text-xs text-gray-600">
    Material de apoyo / Flyer (PDF, PNG o JPG)
  </label>

  <input
    type="file"
    accept=".pdf,image/*"
    onChange={(e) => setFlyerFile(e.target.files?.[0] || null)}
    className="w-full rounded border border-black px-3 py-2 text-sm"
  />

  {flyerFile && (
    <p className="mt-2 text-xs text-green-700">
      Archivo seleccionado: {flyerFile.name}
    </p>
  )}
</div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                Puntos clave
              </label>
              <textarea
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="Ej: 1. Separar correctamente los residuos. 2. Usar recipientes rotulados. 3. Reportar desviaciones."
                className="min-h-28 w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                Mensaje final
              </label>
              <textarea
                value={finalMessage}
                onChange={(e) => setFinalMessage(e.target.value)}
                placeholder="Mensaje de cierre para reforzar la conducta esperada"
                className="min-h-24 w-full rounded border border-black px-3 py-2 text-sm"
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
            {saving ? "Guardando..." : "Guardar charla en biblioteca"}
          </button>
        </div>
      </div>
    </main>
  );
}