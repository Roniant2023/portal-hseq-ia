"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompanyConfig } from "@/lib/company-config";

type SOERecord = {
  id: string;
  fecha: string;
  nombre: string;
  empresa: string;
  ubicacion: string;
  tipo_observacion: string;
  estado: string;
  created_at: string;
};

export default function HistorialPage() {
const companyConfig = getCompanyConfig();
  const [data, setData] = useState<SOERecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/get-soe");
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setError(json?.error || "Error cargando datos");
        return;
      }

      setData(json.data || []);
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
<Link
  href="/control-trabajo/soe"
  className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
>
  ← Volver al SOE
</Link>
      {/* 🔥 SOLO MODIFICAMOS ESTE BLOQUE */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Historial de Observaciones</h1>
          <div className="text-sm text-neutral-600">
  Sistema de Observación {companyConfig.shortName}
</div>
        </div>

        <a
          href="/api/export-soe"
          className="border rounded px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Descargar Excel
        </a>
      </div>

      {loading && <div>Cargando...</div>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Empresa</th>
                <th className="p-2 text-left">Ubicación</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-t hover:bg-neutral-50">
                  <td className="p-2">
                    <Link href={`/control-trabajo/soe/historial/${row.id}`} className="underline">
                      {row.fecha}
                    </Link>
                  </td>
                  <td className="p-2">{row.nombre}</td>
                  <td className="p-2">{row.empresa}</td>
                  <td className="p-2">{row.ubicacion}</td>
                  <td className="p-2">{row.tipo_observacion || "-"}</td>
                  <td className="p-2">{row.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}