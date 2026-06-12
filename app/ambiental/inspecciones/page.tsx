"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type EvidenceItem = {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
  photo?: File | null;
  latitude?: number | null;
  longitude?: number | null;
  capturedAt?: string | null;
};

const initialEvidenceItems: EvidenceItem[] = [
  { id: "ubicacion_equipos", label: "Ubicación de equipos", required: true, checked: false },
  { id: "reuniones", label: "Reuniones", required: true, checked: false },
  { id: "almacenamiento_quimicos", label: "Almacenamiento de químicos", required: true, checked: false },
  { id: "punto_residuos", label: "Punto de residuos", required: true, checked: false },
  { id: "elementos_emergencia", label: "Elementos de emergencia", required: true, checked: false },
  { id: "diques_equipos", label: "Diques de equipos", required: true, checked: false },
];

export default function AmbientalInspeccionesPage() {
  const [inspector, setInspector] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState<EvidenceItem[]>(initialEvidenceItems);
  const [gpsStatus, setGpsStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const now = new Date();

  const handlePhotoChange = (itemId: string, file: File | null) => {
    if (!file) return;

    setGpsStatus("Obteniendo coordenadas GPS...");

    if (!navigator.geolocation) {
      setGpsStatus("El navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const capturedAt = new Date().toISOString();

        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  photo: file,
                  checked: true,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  capturedAt,
                }
              : item
          )
        );

        setGpsStatus("Coordenadas GPS capturadas correctamente.");
      },
      () => {
        setGpsStatus("No fue posible obtener la ubicación GPS.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSave = async () => {
    setMessage("");

    if (!inspector.trim() || !ubicacion.trim()) {
      setMessage("Debe diligenciar inspector y ubicación.");
      return;
    }

    const missingPhotos = items.filter((item) => !item.photo);

    if (missingPhotos.length > 0) {
      setMessage("Debe cargar todas las evidencias fotográficas obligatorias.");
      return;
    }

    setSaving(true);

    try {
      const inspectionDate = new Date();

      const { data: inspection, error: inspectionError } = await supabase
        .from("environmental_inspections")
        .insert({
          inspection_date: inspectionDate.toISOString().split("T")[0],
          inspection_time: inspectionDate.toLocaleTimeString("es-CO"),
          inspector,
          location: ubicacion,
          observations: observaciones,
        })
        .select()
        .single();

      if (inspectionError) throw inspectionError;

      for (const item of items) {
        if (!item.photo) continue;

        const fileExt = item.photo.name.split(".").pop();
        const fileName = `${inspection.id}/${item.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("environmental-evidence")
          .upload(fileName, item.photo);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("environmental-evidence")
          .getPublicUrl(fileName);

        const { error: photoError } = await supabase
          .from("environmental_inspection_photos")
          .insert({
            inspection_id: inspection.id,
            item_id: item.id,
            item_name: item.label,
            photo_url: publicUrlData.publicUrl,
            latitude: item.latitude,
            longitude: item.longitude,
            captured_at: item.capturedAt,
          });

        if (photoError) throw photoError;
      }

      setMessage("Inspección ambiental guardada exitosamente.");
      setInspector("");
      setUbicacion("");
      setObservaciones("");
      setItems(initialEvidenceItems);
    } catch (error: any) {
      const errorMessage = JSON.stringify(
        error,
        Object.getOwnPropertyNames(error),
        2
      );

      console.error("Error completo:", errorMessage);
      setMessage(`Error al guardar: ${error?.message || errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Inspecciones Ambientales
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Registro de evidencias fotográficas georreferenciadas
            </p>
          </div>

          <div className="relative h-16 w-52">
            <Image
              src="/logo-eies.png"
              alt="Estrella International Energy Services"
              fill
              className="object-contain"
              priority
            />
          </div>
        </header>

        <section className="mb-6 rounded border border-black p-4">
          <h2 className="mb-4 text-base font-semibold">Datos generales</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-600">Fecha</label>
              <input
                value={now.toLocaleDateString("es-CO")}
                disabled
                className="w-full rounded border border-black bg-gray-100 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">Hora</label>
              <input
                value={now.toLocaleTimeString("es-CO")}
                disabled
                className="w-full rounded border border-black bg-gray-100 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Inspector
              </label>
              <input
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="Nombre del inspector"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Ubicación
              </label>
              <input
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Base, locación, área o frente de trabajo"
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs text-gray-600">
              Observaciones generales
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Describa hallazgos, condiciones ambientales o comentarios relevantes"
              className="min-h-28 w-full rounded border border-black px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="rounded border border-black p-4">
          <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <h2 className="text-base font-semibold">
                Evidencias fotográficas mínimas
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Cada fotografía debe capturarse desde celular y guardar
                coordenadas GPS.
              </p>
            </div>

            <div className="text-xs text-gray-600">
              Evidencias: {items.filter((item) => item.checked).length} de{" "}
              {items.length}
            </div>
          </div>

          {gpsStatus && (
            <div className="mb-4 rounded border border-black bg-gray-50 px-3 py-2 text-sm">
              {gpsStatus}
            </div>
          )}

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div key={item.id} className="rounded border border-black p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {index + 1}. {item.label}
                    </p>
                    <p className="text-xs text-gray-600">
                      Evidencia obligatoria
                    </p>
                  </div>

                  <span
                    className={`rounded px-3 py-1 text-xs font-semibold ${
                      item.checked
                        ? "bg-green-600 text-white"
                        : "bg-black text-white"
                    }`}
                  >
                    {item.checked ? "Capturada" : "Pendiente"}
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) =>
                    handlePhotoChange(item.id, e.target.files?.[0] || null)
                  }
                  className="mt-3 block w-full rounded border border-black px-3 py-2 text-sm"
                />

                {item.photo && (
                  <div className="mt-3 grid gap-1 rounded border border-gray-300 bg-gray-50 p-3 text-xs text-gray-700 md:grid-cols-2">
                    <p>
                      <strong>Foto:</strong> {item.photo.name}
                    </p>
                    <p>
                      <strong>Capturada:</strong>{" "}
                      {item.capturedAt
                        ? new Date(item.capturedAt).toLocaleString("es-CO")
                        : ""}
                    </p>
                    <p>
                      <strong>Latitud:</strong> {item.latitude}
                    </p>
                    <p>
                      <strong>Longitud:</strong> {item.longitude}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded border border-black bg-gray-50 px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar inspección"}
          </button>
        </div>
      </div>
    </main>
  );
}