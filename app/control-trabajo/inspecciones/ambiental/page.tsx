"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);
type ViewMode = "menu" | "new" | "list";

const ORDER_CLEANLINESS_ITEMS = [
  "¿Los pisos, vías peatonales, pasillos, entradas y salidas se encuentran libres de obstáculos y basura?",
  "¿El cableado de equipos se encuentra debidamente canalizado y no genera riesgo de caídas o de incendio?",
  "¿El área de trabajo se encuentra libre de basura, polvo, aceite, agua, combustibles o materiales combustibles?",
  "¿Los extintores se encuentran en su lugar correspondiente y de fácil acceso?",
  "¿Las zonas del área de trabajo se encuentran adecuadamente demarcadas?",
  "¿Los elementos, equipos o paneles eléctricos están debidamente etiquetados?",
  "¿Las paredes, barandillas y puertas del área de trabajo están limpias?",
  "¿Los pisos están libres de suciedad, escombros, aceite, partes o accesorios?",
  "¿Los equipos y herramientas tienen un uso definido en las actividades rutinarias?",
  "¿Los equipos y herramientas tienen un lugar definido para ser guardados?",
  "¿Hay equipos o herramientas no necesarios en el sitio de trabajo?",
  "¿Todos los equipos tienen uso definido para las actividades propias del área?",
  "¿Hay equipos obsoletos, dañados o rotos?",
  "¿Los equipos tienen ubicación adecuada según necesidad, ergonomía y espacio?",
  "¿Hay documentos no necesarios para las actividades cotidianas?",
];

const ENVIRONMENTAL_KIT_ITEMS = [
  "Linterna",
  "Máscara media cara",
  "Filtro MP/VO",
  "Filtro VO",
  "Monogafas",
  "Cordones absorbentes",
  "Almohadillas absorbentes",
  "Guantes de nitrilo",
  "Pala antichispa",
  "Recipiente para residuos contaminados",
  "Bolsa para residuos contaminados",
  "Cinta de peligro",
  "Traje Tyvek",
  "Botas de caucho",
  "Overol impermeable",
  "Escoba",
  "Recogedor",
  "Caneca de contingencia",
  "Kit de derrames completo",
];

const ECOLOGICAL_POINT_ITEMS = [
  "Caneca blanca (aprovechables)",
  "Caneca verde (orgánicos)",
  "Caneca negra (no aprovechables)",
  "Caneca roja (biosanitarios o peligrosos)",
  "Rotulación visible",
  "Código de colores conforme a la normatividad",
  "Estado físico adecuado de las canecas",
  "Tapas en buen estado",
  "Segregación correcta de residuos",
  "Área limpia y ordenada",
];

const CHEMICAL_STORAGE_ITEMS = [
  "¿Las sustancias químicas se encuentran debidamente rotuladas?",
  "¿Los recipientes se encuentran en buen estado y sin fugas?",
  "¿Se cuenta con hoja de seguridad disponible?",
  "¿Las sustancias incompatibles se encuentran separadas?",
  "¿El área cuenta con ventilación adecuada?",
  "¿El área se encuentra limpia y ordenada?",
  "¿Los productos están almacenados sobre estibas o bandejas de contención?",
  "¿Se cuenta con kit de derrames disponible y completo?",
  "¿El área cuenta con señalización de riesgo químico?",
  "¿Los envases permanecen cerrados cuando no están en uso?",
  "¿Se evita el almacenamiento directo sobre el piso?",
  "¿El personal conoce los riesgos de las sustancias almacenadas?",
  "¿Se cuenta con elementos de protección personal adecuados?",
  "¿Los residuos químicos están identificados y segregados?",
  "¿No se evidencian derrames o manchas en el área?",
  "¿El almacenamiento cumple con condiciones de compatibilidad y seguridad?",
];

const BATHROOM_ITEMS = [
  "BAÑOS DE HOMBRES",
  "OFICINAS ADMINISTRATIVAS",
];

const BATHROOM_CHECK_ITEMS = [
  "Rejilla de ventilación",
  "Dispensador papel sanitario",
  "Palanca de succión",
  "Bizcocho sanitario",
  "Papelera",
  "Piso y tapete",
  "Manguera y tanque de almacenamiento",
];

const WATER_TREATMENT_ITEMS = [
  "Estado general de la planta de tratamiento",
  "Ausencia de fugas o reboses",
  "Estado de tuberías y conexiones",
  "Estado de bombas y equipos asociados",
  "Limpieza del área",
  "Señalización del área",
  "Ausencia de olores ofensivos",
  "Manejo adecuado de lodos o residuos",
  "Registro de operación y mantenimiento",
  "Condiciones de seguridad para el acceso",
];

const HYDRAULIC_NETWORK_ITEMS = [
  "Estado general de la red hidráulica",
  "Ausencia de fugas visibles",
  "Estado de válvulas y conexiones",
  "Estado de mangueras y tuberías",
  "Identificación de líneas o puntos de agua",
  "Presión adecuada del sistema",
  "Estado de tanques de almacenamiento",
  "Limpieza de puntos de suministro",
  "Ausencia de conexiones improvisadas",
  "Drenajes libres de obstrucciones",
  "Canales o cunetas en buen estado",
  "Ausencia de encharcamientos",
  "Mantenimiento preventivo registrado",
  "Condiciones seguras para intervención",
  "Uso eficiente del recurso hídrico",
];

export default function AmbientalPage() {
const [viewMode, setViewMode] = useState<ViewMode>("menu");
const [saving, setSaving] = useState(false);
const [uiInfo, setUiInfo] = useState("");
const [uiError, setUiError] = useState("");
const [openSections, setOpenSections] = useState({
  orderCleanliness: true,
  environmentalKit: false,
  ecologicalPoint: false,
  chemicalStorage: false,
  bathrooms: false,
  waterTreatment: false,
  hydraulicNetwork: false,
});

function toggleSection(section: keyof typeof openSections) {
  setOpenSections((prev) => ({
    ...prev,
    [section]: !prev[section],
  }));
}

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

  order_cleanliness: ORDER_CLEANLINESS_ITEMS.map((question) => ({
    question,
    answer: "CUMPLE",
    observation: "",
  })),

  environmental_kit: ENVIRONMENTAL_KIT_ITEMS.map((item) => ({
    item,
    available: "SI",
    quantity: "",
    status: "B",
    observation: "",
  })),

ecological_point: ECOLOGICAL_POINT_ITEMS.map((item) => ({
  item,
  answer: "CUMPLE",
  observation: "",
})),

chemical_storage: CHEMICAL_STORAGE_ITEMS.map((item) => ({
  item,
  answer: "CUMPLE",
  observation: "",
})),

bathrooms: BATHROOM_ITEMS.map((bathroom) => ({
  bathroom,
  items: BATHROOM_CHECK_ITEMS.map((item) => ({
    item,
    status: "BE",
    observation: "",
  })),
})),

water_treatment: WATER_TREATMENT_ITEMS.map((item) => ({
  item,
  answer: "CUMPLE",
  observation: "",
})),

hydraulic_network: HYDRAULIC_NETWORK_ITEMS.map((item) => ({
  item,
  answer: "CUMPLE",
  observation: "",
})),

});

function updateField(key: string, value: any) {
  setForm((prev) => ({
    ...prev,
    [key]: value,
  }));
}

function calculateResult() {
  const checks = [
    ...form.order_cleanliness,
    ...form.ecological_point,
    ...form.chemical_storage,
    ...form.water_treatment,
    ...form.hydraulic_network,
  ];

  const kitFailures = form.environmental_kit.some(
    (item) => item.available === "NO" || item.status === "M" || item.status === "RC"
  );

  const bathroomFailures = form.bathrooms.some((bathroom) =>
    bathroom.items.some((item) => item.status === "ME")
  );

  const checklistFailures = checks.some(
    (item) => item.answer === "NO CUMPLE"
  );

  return checklistFailures || kitFailures || bathroomFailures
    ? "NO CUMPLE"
    : "CUMPLE";
}

async function saveInspection() {
  try {
    setSaving(true);
    setUiError("");
    setUiInfo("");

    if (!form.inspection_date) {
      setUiError("Debes diligenciar la fecha de inspección.");
      return;
    }

    const result = calculateResult();

    const payload = {
      inspection_date: form.inspection_date,
      inspector_name: form.inspector_name,
      work_front: form.work_front,
      unit: form.unit,
      operator: form.operator,
      well: form.well,
      location:
        form.location === "Otros" ? form.location_other : form.location,
      location_other: form.location_other,
      specific_site: form.specific_site,

      order_cleanliness: form.order_cleanliness,
      environmental_kit: form.environmental_kit,
      ecological_point: form.ecological_point,
      chemical_storage: form.chemical_storage,
      bathrooms: form.bathrooms,
      water_treatment: form.water_treatment,
      hydraulic_network: form.hydraulic_network,

      result,
      observations: "",
      photo_urls: [],
    };

    const { error } = await supabase
      .from("environmental_inspections")
      .insert(payload);

    if (error) {
      setUiError(error.message);
      return;
    }

    setUiInfo("✅ Inspección ambiental guardada correctamente.");
    setViewMode("list");
  } catch (err: any) {
    setUiError(err?.message || "Error guardando inspección ambiental.");
  } finally {
    setSaving(false);
  }
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

<div className="border rounded-xl p-4 space-y-4">
  <button
    type="button"
    onClick={() => toggleSection("orderCleanliness")}
    className="w-full flex items-center justify-between text-left"
  >
    <div className="font-bold text-lg">1. Orden y aseo</div>
    <div className="text-sm text-neutral-500">
      {openSections.orderCleanliness ? "Ocultar ▲" : "Mostrar ▼"}
    </div>
  </button>

  {openSections.orderCleanliness &&
    form.order_cleanliness.map((item, index) => (
    <div key={index} className="border rounded p-3 space-y-2 bg-neutral-50">
      <div className="text-sm font-medium">
        {index + 1}. {item.question}
      </div>

      <select
        className="border p-2 rounded w-full"
        value={item.answer}
        onChange={(e) => {
          const updated = [...form.order_cleanliness];
          updated[index].answer = e.target.value;
          updateField("order_cleanliness", updated);
        }}
      >
        <option value="CUMPLE">Cumple</option>
        <option value="NO CUMPLE">No cumple</option>
        <option value="NA">N/A</option>
      </select>

      <textarea
        className="border p-2 rounded w-full min-h-[70px]"
        placeholder="Observaciones"
        value={item.observation}
        onChange={(e) => {
          const updated = [...form.order_cleanliness];
          updated[index].observation = e.target.value;
          updateField("order_cleanliness", updated);
        }}
      />
    </div>
  ))}
</div>

<div className="border rounded-xl p-4 space-y-4">
  <button
    type="button"
    onClick={() => toggleSection("environmentalKit")}
    className="w-full flex items-center justify-between text-left"
  >
    <div className="font-bold text-lg">
      2. Kit Ambiental
    </div>

    <div className="text-sm text-neutral-500">
      {openSections.environmentalKit
        ? "Ocultar ▲"
        : "Mostrar ▼"}
    </div>
  </button>

  {openSections.environmentalKit &&
    form.environmental_kit.map((item, index) => (
    <div key={index} className="border rounded p-3 space-y-3 bg-neutral-50">
      <div className="font-medium">{item.item}</div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="border p-2 rounded"
          value={item.available}
          onChange={(e) => {
            const updated = [...form.environmental_kit];
            updated[index].available = e.target.value;
            updateField("environmental_kit", updated);
          }}
        >
          <option value="SI">Disponible</option>
          <option value="NO">No disponible</option>
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Cantidad"
          value={item.quantity}
          onChange={(e) => {
            const updated = [...form.environmental_kit];
            updated[index].quantity = e.target.value;
            updateField("environmental_kit", updated);
          }}
        />

        <select
          className="border p-2 rounded"
          value={item.status}
          onChange={(e) => {
            const updated = [...form.environmental_kit];
            updated[index].status = e.target.value;
            updateField("environmental_kit", updated);
          }}
        >
          <option value="B">Bueno</option>
          <option value="M">Malo</option>
          <option value="RC">Reemplazar</option>
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Observación"
          value={item.observation}
          onChange={(e) => {
            const updated = [...form.environmental_kit];
            updated[index].observation = e.target.value;
            updateField("environmental_kit", updated);
          }}
        />
      </div>
    </div>
  ))}
</div>

<div className="border rounded-xl p-4 space-y-4">
  <button
    type="button"
    onClick={() => toggleSection("ecologicalPoint")}
    className="w-full flex items-center justify-between text-left"
  >
    <div className="font-bold text-lg">
      3. Punto Ecológico
    </div>

    <div className="text-sm text-neutral-500">
      {openSections.ecologicalPoint
        ? "Ocultar ▲"
        : "Mostrar ▼"}
    </div>
  </button>

  {openSections.ecologicalPoint &&
    form.ecological_point.map((item, index) => (
    <div key={index} className="border rounded p-3 space-y-2 bg-neutral-50">
      <div className="font-medium">
        {item.item}
      </div>

      <select
        className="border p-2 rounded w-full"
        value={item.answer}
        onChange={(e) => {
          const updated = [...form.ecological_point];
          updated[index].answer = e.target.value;
          updateField("ecological_point", updated);
        }}
      >
        <option value="CUMPLE">Cumple</option>
        <option value="NO CUMPLE">No cumple</option>
        <option value="NA">N/A</option>
      </select>

      <textarea
        className="border p-2 rounded w-full min-h-[70px]"
        placeholder="Observaciones"
        value={item.observation}
        onChange={(e) => {
          const updated = [...form.ecological_point];
          updated[index].observation = e.target.value;
          updateField("ecological_point", updated);
        }}
      />
    </div>
  ))}
</div>

<div className="border rounded-xl p-4 space-y-4">
  <button
    type="button"
    onClick={() => toggleSection("chemicalStorage")}
    className="w-full flex items-center justify-between text-left"
  >
    <div className="font-bold text-lg">
      4. Almacenamiento de Sustancias Químicas
    </div>

    <div className="text-sm text-neutral-500">
      {openSections.chemicalStorage ? "Ocultar ▲" : "Mostrar ▼"}
    </div>
  </button>

  {openSections.chemicalStorage &&
    form.chemical_storage.map((item, index) => (
    <div key={index} className="border rounded p-3 space-y-2 bg-neutral-50">
      <div className="font-medium">
        {index + 1}. {item.item}
      </div>

      <select
        className="border p-2 rounded w-full"
        value={item.answer}
        onChange={(e) => {
          const updated = [...form.chemical_storage];
          updated[index].answer = e.target.value;
          updateField("chemical_storage", updated);
        }}
      >
        <option value="CUMPLE">Cumple</option>
        <option value="NO CUMPLE">No cumple</option>
        <option value="NA">N/A</option>
      </select>

      <textarea
        className="border p-2 rounded w-full min-h-[70px]"
        placeholder="Observaciones"
        value={item.observation}
        onChange={(e) => {
          const updated = [...form.chemical_storage];
          updated[index].observation = e.target.value;
          updateField("chemical_storage", updated);
        }}
      />
    </div>
  ))}
</div>
<div className="border rounded-xl p-4 space-y-4">
  <button
    type="button"
    onClick={() => toggleSection("bathrooms")}
    className="w-full flex items-center justify-between text-left"
  >
    <div className="font-bold text-lg">
      5. Baños
    </div>

    <div className="text-sm text-neutral-500">
      {openSections.bathrooms ? "Ocultar ▲" : "Mostrar ▼"}
    </div>
  </button>

  {openSections.bathrooms &&
    form.bathrooms.map((bathroom, bathroomIndex) => (
    <div
      key={bathroomIndex}
      className="border rounded p-3 space-y-3 bg-neutral-50"
    >
      <div className="font-semibold">
        {bathroom.bathroom}
      </div>

      {bathroom.items.map((item, itemIndex) => (
        <div
          key={itemIndex}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-3"
        >
          <div className="text-sm font-medium">
            {item.item}
          </div>

          <select
            className="border p-2 rounded"
            value={item.status}
            onChange={(e) => {
              const updated = [...form.bathrooms];
              updated[bathroomIndex].items[itemIndex].status = e.target.value;
              updateField("bathrooms", updated);
            }}
          >
            <option value="BE">Buen estado</option>
            <option value="ME">Mal estado</option>
            <option value="NA">N/A</option>
          </select>

          <input
            className="border p-2 rounded"
            placeholder="Observación"
            value={item.observation}
            onChange={(e) => {
              const updated = [...form.bathrooms];
              updated[bathroomIndex].items[itemIndex].observation =
                e.target.value;
              updateField("bathrooms", updated);
            }}
          />
        </div>
      ))}
    </div>
  ))}
</div>

<div className="border rounded-xl p-4 space-y-4">
  <button
    type="button"
    onClick={() => toggleSection("waterTreatment")}
    className="w-full flex items-center justify-between text-left"
  >
    <div className="font-bold text-lg">
      6. Planta de tratamiento de agua
    </div>

    <div className="text-sm text-neutral-500">
      {openSections.waterTreatment
        ? "Ocultar ▲"
        : "Mostrar ▼"}
    </div>
  </button>

  {openSections.waterTreatment &&
    form.water_treatment.map((item, index) => (
    <div key={index} className="border rounded p-3 space-y-2 bg-neutral-50">
      <div className="font-medium">
        {index + 1}. {item.item}
      </div>

      <select
        className="border p-2 rounded w-full"
        value={item.answer}
        onChange={(e) => {
          const updated = [...form.water_treatment];
          updated[index].answer = e.target.value;
          updateField("water_treatment", updated);
        }}
      >
        <option value="CUMPLE">Cumple</option>
        <option value="NO CUMPLE">No cumple</option>
        <option value="NA">N/A</option>
      </select>

      <textarea
        className="border p-2 rounded w-full min-h-[70px]"
        placeholder="Observaciones"
        value={item.observation}
        onChange={(e) => {
          const updated = [...form.water_treatment];
          updated[index].observation = e.target.value;
          updateField("water_treatment", updated);
        }}
      />
    </div>
  ))}
</div>

<div className="border rounded-xl p-4 space-y-4">
  <button
    type="button"
    onClick={() => toggleSection("hydraulicNetwork")}
    className="w-full flex items-center justify-between text-left"
  >
    <div className="font-bold text-lg">
      7. Red hidráulica
    </div>

    <div className="text-sm text-neutral-500">
      {openSections.hydraulicNetwork ? "Ocultar ▲" : "Mostrar ▼"}
    </div>
  </button>

  {openSections.hydraulicNetwork &&
    form.hydraulic_network.map((item, index) => (
    <div key={index} className="border rounded p-3 space-y-2 bg-neutral-50">
      <div className="font-medium">
        {index + 1}. {item.item}
      </div>

      <select
        className="border p-2 rounded w-full"
        value={item.answer}
        onChange={(e) => {
          const updated = [...form.hydraulic_network];
          updated[index].answer = e.target.value;
          updateField("hydraulic_network", updated);
        }}
      >
        <option value="CUMPLE">Cumple</option>
        <option value="NO CUMPLE">No cumple</option>
        <option value="NA">N/A</option>
      </select>

      <textarea
        className="border p-2 rounded w-full min-h-[70px]"
        placeholder="Observaciones"
        value={item.observation}
        onChange={(e) => {
          const updated = [...form.hydraulic_network];
          updated[index].observation = e.target.value;
          updateField("hydraulic_network", updated);
        }}
      />
    </div>
  ))}
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
<button
  type="button"
  onClick={saveInspection}
  disabled={saving}
  className="w-full bg-green-700 text-white py-3 rounded font-semibold disabled:opacity-50"
>
  {saving ? "Guardando..." : "Guardar inspección ambiental"}
</button>

{uiInfo && (
  <div className="border rounded p-3 bg-green-50 border-green-200 text-green-800 text-sm">
    {uiInfo}
  </div>
)}

{uiError && (
  <div className="border rounded p-3 bg-red-50 border-red-200 text-red-800 text-sm">
    {uiError}
  </div>
)}
          </section>
        )}

      </div>
    </main>
  );
}