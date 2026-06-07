"use client";

import { useState } from "react";

type ViewMode = "menu" | "new" | "list";

export default function AmbientalPage() {
const [viewMode, setViewMode] = useState<ViewMode>("menu");

const [form, setForm] = useState({
  inspection_date: "",
  inspector_name: "",
  work_front: "",
  unit: "",
  operator: "",
  well: "",
  location: "",
specific_site: "",
  location_other: "",
 
});

function updateField(key: string, value: any) {
  setForm((prev) => ({
    ...prev,
    [key]: value,
  }));
}


  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        <div>
          <a
            href="/control-trabajo/inspecciones"
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a Inspecciones
          </a>

          <h1 className="text-3xl font-bold mt-2">
            Inspección Ambiental
          </h1>

          <p className="text-sm text-neutral-600">
            Gestión y seguimiento de inspecciones ambientales.
          </p>
        </div>

        {viewMode === "menu" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <button
              type="button"
              onClick={() => setViewMode("new")}
              className="border rounded-2xl p-6 bg-white shadow-sm text-left hover:shadow-md transition"
            >
              <div className="text-4xl mb-3">🌱</div>

              <div className="text-2xl font-bold">
                Registrar inspección
              </div>

              <div className="text-sm text-neutral-600 mt-2">
                Registrar una nueva inspección ambiental.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="border rounded-2xl p-6 bg-white shadow-sm text-left hover:shadow-md transition"
            >
              <div className="text-4xl mb-3">📋</div>

              <div className="text-2xl font-bold">
                Consultar inspecciones
              </div>

              <div className="text-sm text-neutral-600 mt-2">
                Consultar inspecciones ambientales registradas.
              </div>
            </button>

          </section>
        )}

        {viewMode === "new" && (
          <section className="border rounded-xl p-6 bg-white shadow-sm space-y-4">

            <div className="bg-green-700 text-white text-center py-3 rounded font-bold">
              INSPECCIÓN AMBIENTAL
            </div>

            <button
              type="button"
              onClick={() => setViewMode("menu")}
              className="border rounded px-4 py-2"
            >
              ← Volver al menú
            </button>

<div className="grid grid-cols-1 md:grid-cols-3 gap-3">

  <div>
    <label className="text-xs font-medium">
      Fecha inspección
    </label>

    <input
      type="date"
      className="border p-2 rounded w-full"
      value={form.inspection_date}
      onChange={(e) =>
        updateField("inspection_date", e.target.value)
      }
    />
  </div>

  <div>
    <label className="text-xs font-medium">
      Inspector
    </label>

    <input
      className="border p-2 rounded w-full"
      value={form.inspector_name}
      onChange={(e) =>
        updateField("inspector_name", e.target.value)
      }
    />
  </div>

  <div>
    <label className="text-xs font-medium">
      Operadora
    </label>

    <input
      className="border p-2 rounded w-full"
      value={form.operator}
      onChange={(e) =>
        updateField("operator", e.target.value)
      }
    />
  </div>

  <div>
    <label className="text-xs font-medium">
      Frente de trabajo
    </label>

    <input
      className="border p-2 rounded w-full"
      value={form.work_front}
      onChange={(e) =>
        updateField("work_front", e.target.value)
      }
    />
  </div>

  <div>
    <label className="text-xs font-medium">
      Unidad
    </label>

    <input
      className="border p-2 rounded w-full"
      value={form.unit}
      onChange={(e) =>
        updateField("unit", e.target.value)
      }
    />
  </div>

  <div>
    <label className="text-xs font-medium">
      Pozo
    </label>

    <input
      className="border p-2 rounded w-full"
      value={form.well}
      onChange={(e) =>
        updateField("well", e.target.value)
      }
    />
  </div>

  <div className="md:col-span-3">
    <label className="text-xs font-medium">
      Ubicación
    </label>

    <select
      className="border p-2 rounded w-full"
      value={form.location}
      onChange={(e) =>
        updateField("location", e.target.value)
      }
    >
      <option value="">Seleccione ubicación</option>
      <option value="Base Tocancipa">Base Tocancipa</option>
      <option value="Base Palermo">Base Palermo</option>
      <option value="Lote La Florida">Lote La Florida</option>
      <option value="Well Services">Well Services</option>
      <option value="Rig E2027">Rig E2027</option>
      <option value="Otros">Otros</option>
    </select>

   <input
  className="border p-2 rounded w-full mt-2"
  placeholder="Sitio específico"
  value={form.specific_site}
  onChange={(e) =>
    updateField("specific_site", e.target.value)
  }
/>

    {form.location === "Otros" && (
      <input
        className="border p-2 rounded w-full mt-2"
        placeholder="Especifique ubicación"
        value={form.location_other}
        onChange={(e) =>
          updateField("location_other", e.target.value)
        }
      />
    )}
  </div>

</div>            

          </section>
        )}

        {viewMode === "list" && (
          <section className="border rounded-xl p-6 bg-white shadow-sm space-y-4">

            <button
              type="button"
              onClick={() => setViewMode("menu")}
              className="border rounded px-4 py-2"
            >
              ← Volver al menú
            </button>

            <div className="text-center text-neutral-500 py-10">
              Consulta de inspecciones ambientales en construcción...
            </div>

          </section>
        )}

      </div>
    </main>
  );
}