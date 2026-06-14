"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import QRCode from "react-qr-code";
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
flyer_url: string | null;
  } | null;
};

export default function EjecutarCharlaDetallePage() {
  const params = useParams();
  const id = params.id as string;

  const [talk, setTalk] = useState<ScheduledTalk | null>(null);
  const [loading, setLoading] = useState(true);
const [responsible, setResponsible] = useState("");
const [location, setLocation] = useState("");
const [observations, setObservations] = useState("");
const [evidencePhoto, setEvidencePhoto] = useState<File | null>(null);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
const [executionId, setExecutionId] = useState("");
  useEffect(() => {
    loadTalk();
  }, []);

  const loadTalk = async () => {
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
  final_message,
  flyer_url
)
      `)
      .eq("id", id)
      .single();

   if (error) {
  console.error(error);
} else {
  setTalk({
    ...data,
    hseq_talk_library: Array.isArray(data.hseq_talk_library)
      ? data.hseq_talk_library[0] || null
      : data.hseq_talk_library,
  } as ScheduledTalk);
}
    setLoading(false);
  };

const handleFinishTalk = async () => {
  setMessage("");

  if (!responsible.trim() || !location.trim() || !evidencePhoto) {
    setMessage("Debe diligenciar responsable, ubicación y foto evidencia.");
    return;
  }

  setSaving(true);

  try {
    const now = new Date();
    const fileExt = evidencePhoto.name.split(".").pop();
    const fileName = `${id}/evidencia-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("hseq-talk-evidence")
      .upload(fileName, evidencePhoto);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("hseq-talk-evidence")
      .getPublicUrl(fileName);

    const { data: executionData, error: executionError } = await supabase
  .from("hseq_talk_executions")
  .insert({
    schedule_id: id,
    executed_date: now.toISOString().split("T")[0],
    start_time: now.toLocaleTimeString("es-CO"),
    end_time: now.toLocaleTimeString("es-CO"),
    responsible,
    location,
    observations,
    evidence_photo_url: publicUrlData.publicUrl,
    status: "ejecutada",
  })
  .select()
  .single();

    if (executionError) throw executionError;
setExecutionId(executionData.id);
    await supabase
      .from("hseq_monthly_schedule")
      .update({ status: "ejecutada" })
      .eq("id", id);

    setMessage("Charla finalizada y registrada exitosamente.");
  } catch (error: any) {
    console.error(error);
    setMessage(
      `Error al finalizar la charla: ${error?.message || "Error desconocido"}`
    );
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        Cargando charla...
      </main>
    );
  }

  if (!talk) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        No se encontró la charla.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-gray-500">
          Semana {talk.week_number} · {talk.hseq_talk_library?.category}
        </p>

        <h1 className="mt-2 text-4xl font-black">
          {talk.hseq_talk_library?.title}
        </h1>

        <p className="mt-2 text-gray-600">
          Duración estimada: {talk.hseq_talk_library?.duration_minutes} minutos
        </p>
{talk.hseq_talk_library?.flyer_url && (
  <section className="mt-8 rounded border border-black p-5">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-bold">Material de apoyo</h2>

      <a
        href={talk.hseq_talk_library.flyer_url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Abrir en otra pestaña
      </a>
    </div>

    <div className="mt-4 overflow-hidden rounded border border-gray-300 bg-gray-100">
      {talk.hseq_talk_library.flyer_url.toLowerCase().endsWith(".pdf") ? (
        <iframe
          src={talk.hseq_talk_library.flyer_url}
          className="h-[600px] w-full"
          title="Flyer de la charla"
        />
      ) : (
        <img
          src={talk.hseq_talk_library.flyer_url}
          alt="Flyer de la charla"
          className="max-h-[700px] w-full object-contain"
        />
      )}
    </div>
  </section>
)}

        <section className="mt-8 rounded border border-black p-5">
          <h2 className="text-xl font-bold">Objetivo de la charla</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm">
            {talk.hseq_talk_library?.objective}
          </p>
        </section>

        <section className="mt-6 rounded border border-black p-5">
          <h2 className="text-xl font-bold">Guía para el expositor</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm">
            {talk.hseq_talk_library?.guide_content}
          </p>
        </section>

        <section className="mt-6 rounded border border-black p-5">
          <h2 className="text-xl font-bold">Puntos clave</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm">
            {talk.hseq_talk_library?.key_points}
          </p>
        </section>

        <section className="mt-6 rounded bg-black p-5 text-white">
          <h2 className="text-xl font-bold">Mensaje final</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm">
            {talk.hseq_talk_library?.final_message}
          </p>
        </section>

        <section className="mt-6 rounded border border-black p-5">
  <h2 className="text-xl font-bold">Ejecución de la charla</h2>

  <div className="mt-4 grid gap-4 md:grid-cols-2">
    <div>
      <label className="mb-1 block text-xs text-gray-600">
        Responsable de la charla
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
        placeholder="Base, locación o frente"
        className="w-full rounded border border-black px-3 py-2 text-sm"
      />
    </div>

    <div className="md:col-span-2">
      <label className="mb-1 block text-xs text-gray-600">
        Observaciones
      </label>
      <textarea
        value={observations}
        onChange={(e) => setObservations(e.target.value)}
        placeholder="Comentarios relevantes de la ejecución"
        className="min-h-24 w-full rounded border border-black px-3 py-2 text-sm"
      />
    </div>

    <div className="md:col-span-2">
      <label className="mb-1 block text-xs text-gray-600">
        Foto evidencia de la charla
      </label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setEvidencePhoto(e.target.files?.[0] || null)}
        className="w-full rounded border border-black px-3 py-2 text-sm"
      />
    </div>
  </div>
</section>

{message && (
  <div className="mt-6 rounded border border-black bg-gray-50 px-4 py-3 text-sm">
    {message}
  </div>
)}

{executionId && (
  <section className="mt-6 rounded border border-green-700 bg-green-50 p-6">
    <h2 className="text-xl font-bold text-green-800">
      Asistencia de participantes
    </h2>

    <p className="mt-2 text-sm text-green-700">
      Escanee este código QR para registrar asistencia.
    </p>

    <div className="mt-6 flex justify-center">
      <div className="bg-white p-4 rounded-lg">
        <QRCode
          size={220}
          value={`${window.location.origin}/ambiental/charlas/asistencia/${executionId}`}
        />
      </div>
    </div>

    <div className="mt-4 text-center text-xs text-gray-600 break-all">
      {`${window.location.origin}/ambiental/charlas/asistencia/${executionId}`}
    </div>
  </section>
)}

<div className="mt-8 flex justify-end">
  <button
    type="button"
    onClick={handleFinishTalk}
    disabled={saving}
    className="rounded bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
  >
    {saving ? "Finalizando..." : "Finalizar charla"}
  </button>
</div>
      </div>
    </main>
  );
}