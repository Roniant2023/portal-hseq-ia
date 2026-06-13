"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type Photo = {
  id: string;
  item_id: string;
  item_name: string;
  photo_url: string;
  latitude: number | null;
  longitude: number | null;
  captured_at: string | null;
  comments: string | null;
};

type Inspection = {
  id: string;
  inspection_date: string;
  inspection_time: string;
  inspector: string;
  location: string;
  observations: string | null;
  environmental_inspection_photos: Photo[];
};

export default function DetalleRegistroFotograficoPage() {
  const params = useParams();
  const id = params.id as string;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspection();
  }, []);

  const loadInspection = async () => {
    const { data, error } = await supabase
      .from("environmental_inspections")
      .select(`
        *,
        environmental_inspection_photos (
          id,
          item_id,
          item_name,
          photo_url,
          latitude,
          longitude,
          captured_at,
          comments
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setInspection(data);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">Cargando detalle...</div>
      </main>
    );
  }

  if (!inspection) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          No se encontró el registro.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-black">
          Detalle Registro Fotográfico ICA
        </h1>

        <p className="mt-2 text-gray-600">
          Consulta del registro ambiental y sus evidencias fotográficas.
        </p>

        <section className="mt-8 rounded-xl border border-black p-4">
          <h2 className="text-xl font-bold">Datos generales</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="font-semibold">{inspection.inspection_date}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Hora</p>
              <p className="font-semibold">{inspection.inspection_time}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Inspector</p>
              <p className="font-semibold">{inspection.inspector}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Ubicación</p>
              <p className="font-semibold">{inspection.location}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap">
              {inspection.observations || "Sin observaciones registradas."}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Evidencias fotográficas</h2>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {inspection.environmental_inspection_photos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-xl border border-black"
              >
                <div className="border-b border-black bg-gray-100 p-3">
                  <h3 className="font-bold">{photo.item_name}</h3>
                </div>

                <div className="relative h-80 w-full bg-gray-100">
  <img
    src={photo.photo_url}
    alt={photo.item_name}
    className="h-full w-full object-contain"
  />

  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 text-xs text-white">
    <p>
      📍 Lat: {photo.latitude ?? "No registrada"} | Lon:{" "}
      {photo.longitude ?? "No registrada"}
    </p>

    <p>
      🕒{" "}
      {photo.captured_at
        ? new Date(photo.captured_at).toLocaleString("es-CO")
        : "Fecha no registrada"}
    </p>
  </div>
</div>

                <div className="space-y-2 p-4 text-sm">
                  <p>
                    <strong>Latitud:</strong> {photo.latitude ?? "No registrada"}
                  </p>

                  <p>
                    <strong>Longitud:</strong>{" "}
                    {photo.longitude ?? "No registrada"}
                  </p>

                  <p>
                    <strong>Capturada:</strong>{" "}
                    {photo.captured_at
                      ? new Date(photo.captured_at).toLocaleString("es-CO")
                      : "No registrada"}
                  </p>

                  {photo.latitude && photo.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                    >
                      Ver ubicación en Google Maps
                    </a>
                  )}

                  {photo.comments && (
                    <div className="rounded border bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-500">
                        Comentario
                      </p>
                      <p>{photo.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}