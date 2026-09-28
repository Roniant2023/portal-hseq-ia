"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompanyConfig } from "@/lib/company-config";

type SOEDetail = {
  id: string;
  fecha: string;
  cedula: string;
  cargo: string;
  nombre: string;
  empresa: string;
  ubicacion: string;
  frente_equipo: string;
  tipo_observacion: string;
  se_detuvo_tarea: string;
  area_unidad: string;
  area_otro: string;
  operacion_tarea: string;
  operacion_otro: string;
  descripcion_original: string;
  descripcion_mejorada: string;
  accion_inmediata: string;
  recomendacion: string;
  supervisor_control: string;
  requiere_seguimiento: string;
  requiere_ail: string;
  estado: string;
};

export default function SOEDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const companyConfig = getCompanyConfig();
  const [record, setRecord] = useState<SOEDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      try {
        setLoading(true);
        setError(null);

        const { id } = await params;

        const res = await fetch(`/api/get-soe/${id}`);
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          setError(json?.error || "Error cargando observación");
          return;
        }

        setRecord(json.data);
      } catch (err: any) {
        setError(err?.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [params]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Detalle de Observación</h1>
          <div className="text-sm text-neutral-600">
  Sistema de Observación {companyConfig.shortName}
</div>
        </div>

        <Link
          href="/control-trabajo/soe/historial"
          className="border rounded px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Volver al historial
        </Link>
      </div>

      {loading && <div>Cargando...</div>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && record && (
        <section className="border rounded p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-neutral-500">Fecha</div>
              <div className="font-medium">{record.fecha || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Cédula</div>
              <div className="font-medium">{record.cedula || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Cargo</div>
              <div className="font-medium">{record.cargo || "-"}</div>
            </div>

            <div>
              <div className="text-xs text-neutral-500">Nombre</div>
              <div className="font-medium">{record.nombre || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Empresa</div>
              <div className="font-medium">{record.empresa || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Ubicación</div>
              <div className="font-medium">{record.ubicacion || "-"}</div>
            </div>

            <div>
              <div className="text-xs text-neutral-500">Frente / Equipo</div>
              <div className="font-medium">{record.frente_equipo || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Tipo observación</div>
              <div className="font-medium">{record.tipo_observacion || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">¿Se detuvo la tarea?</div>
              <div className="font-medium">{record.se_detuvo_tarea || "-"}</div>
            </div>

            <div>
              <div className="text-xs text-neutral-500">Área / Unidad</div>
              <div className="font-medium">
                {record.area_unidad === "Otro"
                  ? record.area_otro || "Otro"
                  : record.area_unidad || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Operación / Tarea</div>
              <div className="font-medium">
                {record.operacion_tarea === "Otro"
                  ? record.operacion_otro || "Otro"
                  : record.operacion_tarea || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Estado</div>
              <div className="font-medium">{record.estado || "-"}</div>
            </div>
          </div>

          <div className="border rounded p-4 space-y-2">
            <div className="font-semibold">Descripción original</div>
            <div className="text-sm whitespace-pre-wrap">
              {record.descripcion_original || "-"}
            </div>
          </div>

          <div className="border rounded p-4 space-y-2">
            <div className="font-semibold">Descripción mejorada</div>
            <div className="text-sm whitespace-pre-wrap">
              {record.descripcion_mejorada || "-"}
            </div>
          </div>

          <div className="border rounded p-4 space-y-2">
            <div className="font-semibold">Acción inmediata</div>
            <div className="text-sm whitespace-pre-wrap">
              {record.accion_inmediata || "-"}
            </div>
          </div>

          <div className="border rounded p-4 space-y-2">
            <div className="font-semibold">Recomendación</div>
            <div className="text-sm whitespace-pre-wrap">
              {record.recomendacion || "-"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-neutral-500">Responsable</div>
              <div className="font-medium">{record.supervisor_control || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">¿Requiere seguimiento?</div>
              <div className="font-medium">{record.requiere_seguimiento || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">¿Requiere AIL?</div>
              <div className="font-medium">{record.requiere_ail || "-"}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}