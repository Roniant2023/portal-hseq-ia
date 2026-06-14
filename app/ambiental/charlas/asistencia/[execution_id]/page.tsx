"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function AsistenciaCharlaPage() {
  const params = useParams();
  const executionId = params.execution_id as string;

  const [participantName, setParticipantName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setMessage("");

    if (!participantName.trim() || !participantId.trim()) {
      setMessage("Debe diligenciar nombre y cédula.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("hseq_talk_attendance").insert({
      execution_id: executionId,
      participant_name: participantName,
      participant_id: participantId,
      position,
      company,
      score: null,
      signature_url: null,
    });

    if (error) {
      console.error(error);
      setMessage("Error al registrar la asistencia.");
    } else {
      setMessage("Asistencia registrada exitosamente.");
      setParticipantName("");
      setParticipantId("");
      setPosition("");
      setCompany("");
    }

    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black">Registro de asistencia</h1>

        <p className="mt-2 text-sm text-gray-600">
          Diligencie sus datos para registrar asistencia a la charla HSEQ.
        </p>

        <section className="mt-8 rounded border border-black p-4">
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Nombre completo
              </label>
              <input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Nombre del participante"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Cédula
              </label>
              <input
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="Número de identificación"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Cargo
              </label>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Cargo"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Empresa
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Empresa"
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

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Registrando..." : "Registrar asistencia"}
          </button>
        </div>
      </div>
    </main>
  );
}