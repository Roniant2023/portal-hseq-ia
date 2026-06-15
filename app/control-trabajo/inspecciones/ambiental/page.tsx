"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SignaturePadField from "../../../components/SignaturePadField";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);
type ViewMode = "menu" | "new" | "list" | "detail";

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
  "BAÑOS DE MUJERES",
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
const [records, setRecords] = useState<any[]>([]);
const [selectedRecord, setSelectedRecord] = useState<any>(null);
const [openSections, setOpenSections] = useState({
  orderCleanliness: true,
  environmentalKit: false,
  ecologicalPoint: false,
  chemicalStorage: false,
  bathrooms: false,
  waterTreatment: false,
  hydraulicNetwork: false,

});
const [activeSection, setActiveSection] = useState("orderCleanliness");
const [reviewedSections, setReviewedSections] = useState<string[]>([]);
const [notApplicableSections, setNotApplicableSections] = useState<string[]>([]);
function toggleSection(section: keyof typeof openSections) {
  setOpenSections((prev) => ({
    ...prev,
    [section]: !prev[section],
  }));
}



const inspectionSections = [
  { id: "orderCleanliness", label: "Orden y aseo" },
  { id: "environmentalKit", label: "Kit ambiental" },
  { id: "ecologicalPoint", label: "Punto ecológico" },
  { id: "chemicalStorage", label: "Químicos" },
  { id: "bathrooms", label: "Baños" },
  { id: "waterTreatment", label: "PTAR / Agua" },
  { id: "hydraulicNetwork", label: "Red hidráulica" },
];
const allSectionsReviewed =
  reviewedSections.length === inspectionSections.length;
const [form, setForm] = useState({
  inspection_date: "",
  inspector_name: "",
  operator: "",
  location: "",
  specific_site: "",
  location_other: "",
signature_url: "",


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

function getSectionStatus(section: string) {
  let items: any[] = [];

  if (section === "orderCleanliness") items = form.order_cleanliness;
  if (section === "environmentalKit") items = form.environmental_kit;
  if (section === "ecologicalPoint") items = form.ecological_point;
  if (section === "chemicalStorage") items = form.chemical_storage;
  if (section === "bathrooms") items = form.bathrooms;
  if (section === "waterTreatment") items = form.water_treatment;
  if (section === "hydraulicNetwork") items = form.hydraulic_network;

  const serialized = JSON.stringify(items);

  const hasFinding =
    serialized.includes("NO CUMPLE") ||
    serialized.includes('"NO"') ||
    serialized.includes('"M"') ||
    serialized.includes('"RC"') ||
    serialized.includes('"ME"');

  const hasObservation = serialized.includes('"observation":"') &&
    !serialized.includes('"observation":""');

if (hasFinding) return "finding";
if (notApplicableSections.includes(section)) return "na";
if (reviewedSections.includes(section)) return "completed";
if (hasObservation) return "progress";
return "pending";
}
function updateField(key: string, value: any) {
  setForm((prev) => ({
    ...prev,
    [key]: value,
  }));
}

function markSectionAsNotApplicable(section: string) {
 if (notApplicableSections.includes(section)) {
  setNotApplicableSections((prev) =>
    prev.filter((item) => item !== section)
  );

  setReviewedSections((prev) =>
    prev.filter((item) => item !== section)
  );

  return;
}
  if (section === "orderCleanliness") {
    updateField(
      "order_cleanliness",
      form.order_cleanliness.map((item) => ({
        ...item,
        answer: "NA",
        observation: "No aplica para el sitio inspeccionado.",
      }))
    );
  }

  if (section === "environmentalKit") {
    updateField(
      "environmental_kit",
      form.environmental_kit.map((item) => ({
        ...item,
        available: "NA",
        status: "NA",
        observation: "No aplica para el sitio inspeccionado.",
      }))
    );
  }

  if (section === "ecologicalPoint") {
    updateField(
      "ecological_point",
      form.ecological_point.map((item) => ({
        ...item,
        answer: "NA",
        observation: "No aplica para el sitio inspeccionado.",
      }))
    );
  }

  if (section === "chemicalStorage") {
    updateField(
      "chemical_storage",
      form.chemical_storage.map((item) => ({
        ...item,
        answer: "NA",
        observation: "No aplica para el sitio inspeccionado.",
      }))
    );
  }

  if (section === "bathrooms") {
    updateField(
      "bathrooms",
      form.bathrooms.map((bathroom) => ({
        ...bathroom,
        items: bathroom.items.map((item) => ({
          ...item,
          status: "NA",
          observation: "No aplica para el sitio inspeccionado.",
        })),
      }))
    );
  }

  if (section === "waterTreatment") {
    updateField(
      "water_treatment",
      form.water_treatment.map((item) => ({
        ...item,
        answer: "NA",
        observation: "No aplica para el sitio inspeccionado.",
      }))
    );
  }

  if (section === "hydraulicNetwork") {
    updateField(
      "hydraulic_network",
      form.hydraulic_network.map((item) => ({
        ...item,
        answer: "NA",
        observation: "No aplica para el sitio inspeccionado.",
      }))
    );
  }

 

setNotApplicableSections((prev) => [...prev, section]);

if (!reviewedSections.includes(section)) {
  setReviewedSections((prev) => [...prev, section]);
}
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

function getInspectionSummary() {
  const findings: string[] = [];

  if (form.order_cleanliness.some((item) => item.answer === "NO CUMPLE")) {
    findings.push("Orden y aseo");
  }

  if (
    form.environmental_kit.some(
      (item) =>
        item.available === "NO" ||
        item.status === "M" ||
        item.status === "RC"
    )
  ) {
    findings.push("Kit ambiental");
  }

  if (form.ecological_point.some((item) => item.answer === "NO CUMPLE")) {
    findings.push("Punto ecológico");
  }

  if (form.chemical_storage.some((item) => item.answer === "NO CUMPLE")) {
    findings.push("Químicos");
  }

  if (
    form.bathrooms.some((bathroom) =>
      bathroom.items.some((item) => item.status === "ME")
    )
  ) {
    findings.push("Baños");
  }

  if (form.water_treatment.some((item) => item.answer === "NO CUMPLE")) {
    findings.push("PTAR / Agua");
  }

  if (form.hydraulic_network.some((item) => item.answer === "NO CUMPLE")) {
    findings.push("Red hidráulica");
  }

  const notApplicableLabels = inspectionSections
    .filter((section) => notApplicableSections.includes(section.id))
    .map((section) => section.label);

  return {
    result: calculateResult(),
    findings,
    notApplicableLabels,
  };
}

const inspectionSummary = getInspectionSummary();
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
      operator: form.operator,
      location:
        form.location === "Otros" ? form.location_other : form.location,
      location_other: form.location_other,
      specific_site: form.specific_site,
signature_url: form.signature_url,

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
await loadRecords();
    setViewMode("list");
  } catch (err: any) {
    setUiError(err?.message || "Error guardando inspección ambiental.");
  } finally {
    setSaving(false);
  }
}

async function loadRecords() {
  const { data, error } = await supabase
    .from("environmental_inspections")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    setUiError(error.message);
    return;
  }

  setRecords(data || []);
}

useEffect(() => {
  loadRecords();
}, []);

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

  <div className="md:col-span-3 mt-4">
    <SignaturePadField
      label="Firma del inspector"
      value={form.signature_url}
      onChange={(dataUrl) =>
        updateField("signature_url", dataUrl)
      }
    />
  </div>

</div>            

<div className="border rounded-xl p-4 bg-neutral-50">

  <div className="font-bold text-lg mb-3">
    Módulos de inspección
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    {inspectionSections.map((section) => {
      const status = getSectionStatus(section.id);

      const colorClass =
     status === "finding"
  ? "bg-red-600 text-white border-red-700"
 : status === "completed"
? "bg-green-700 text-white border-green-800"
: status === "na"
? "bg-neutral-600 text-white border-neutral-700"
: status === "progress"
          ? "bg-yellow-400 text-black border-yellow-500"
         : activeSection === section.id
? "bg-blue-700 text-white border-blue-800"
: "bg-white text-black border-neutral-300";

     return (
  <div
    key={section.id}
    className={`rounded-xl border p-4 transition hover:shadow ${colorClass}`}
  >
    <button
      type="button"
      onClick={() => setActiveSection(section.id)}
      className="w-full text-left font-semibold"
    >
      {section.label}

      <div className="mt-1 text-xs font-normal">
        {status === "finding"
          ? "Con hallazgos"
          : status === "completed"
? "Revisado"
: status === "na"
? "No aplica"
: status === "progress"
          ? "En proceso"
          : activeSection === section.id
          ? "Seleccionado"
          : "No iniciado"}
      </div>
    </button>

    <label className="mt-3 flex items-center gap-2 rounded border border-black bg-white px-3 py-2 text-xs font-semibold text-black">
  <input
    type="checkbox"
    checked={notApplicableSections.includes(section.id)}
    onChange={(e) => {
      e.stopPropagation();
      markSectionAsNotApplicable(section.id);
    }}
  />

  No aplica
</label>
  </div>
);
    })}
  </div>
</div>
{activeSection === "orderCleanliness" && (
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

  <button
  type="button"
  onClick={() => {
    if (!reviewedSections.includes("orderCleanliness")) {
      setReviewedSections((prev) => [
        ...prev,
        "orderCleanliness",
      ]);
    }

    setActiveSection("environmentalKit");
  }}
  className="bg-green-700 text-white px-4 py-2 rounded"
>
  ✓ Marcar módulo revisado
</button>
</div>
)}
{activeSection === "environmentalKit" && (
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

<button
  type="button"
  onClick={() => {
    if (!reviewedSections.includes("environmentalKit")) {
      setReviewedSections((prev) => [
        ...prev,
        "environmentalKit",
      ]);
    }

    setActiveSection("ecologicalPoint");
  }}
  className="bg-green-700 text-white px-4 py-2 rounded"
>
  ✓ Marcar módulo revisado
</button>
</div>
)}
{activeSection === "ecologicalPoint" && (
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
<button
  type="button"
  onClick={() => {
    if (!reviewedSections.includes("ecologicalPoint")) {
      setReviewedSections((prev) => [
        ...prev,
        "ecologicalPoint",
      ]);
    }

    setActiveSection("chemicalStorage");
  }}
  className="bg-green-700 text-white px-4 py-2 rounded"
>
  ✓ Marcar módulo revisado
</button>
</div>
)}
{activeSection === "chemicalStorage" && (
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
<button
  type="button"
  onClick={() => {
    if (!reviewedSections.includes("chemicalStorage")) {
      setReviewedSections((prev) => [
        ...prev,
        "chemicalStorage",
      ]);
    }

    setActiveSection("bathrooms");
  }}
  className="bg-green-700 text-white px-4 py-2 rounded"
>
  ✓ Marcar módulo revisado
</button>
</div>
)}
{activeSection === "bathrooms" && (
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
<button
  type="button"
  onClick={() => {
    if (!reviewedSections.includes("bathrooms")) {
      setReviewedSections((prev) => [
        ...prev,
        "bathrooms",
      ]);
    }

    setActiveSection("waterTreatment");
  }}
  className="bg-green-700 text-white px-4 py-2 rounded"
>
  ✓ Marcar módulo revisado
</button>
</div>
)}
{activeSection === "waterTreatment" && (
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
<button
  type="button"
  onClick={() => {
    if (!reviewedSections.includes("waterTreatment")) {
      setReviewedSections((prev) => [
        ...prev,
        "waterTreatment",
      ]);
    }

    setActiveSection("hydraulicNetwork");
  }}
  className="bg-green-700 text-white px-4 py-2 rounded"
>
  ✓ Marcar módulo revisado
</button>
</div>
)}
{activeSection === "hydraulicNetwork" && (
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
<button
  type="button"
  onClick={() => {
    if (!reviewedSections.includes("hydraulicNetwork")) {
      setReviewedSections((prev) => [
        ...prev,
        "hydraulicNetwork",
      ]);
    }
  }}
  className="bg-green-700 text-white px-4 py-2 rounded"
>
  ✓ Finalizar inspección
</button>
</div>
)}
{allSectionsReviewed && (
  <div className="rounded-xl border border-black bg-white p-4 space-y-3">
    <div className="text-lg font-bold">
      Resumen final de la inspección
    </div>

    <div className="text-sm">
      <strong>Resultado general:</strong>{" "}
      {inspectionSummary.result}
    </div>

    <div className="text-sm">
      <strong>Módulos con hallazgos:</strong>{" "}
      {inspectionSummary.findings.length > 0
        ? inspectionSummary.findings.join(", ")
        : "Sin hallazgos"}
    </div>

    <div className="text-sm">
      <strong>Módulos no aplicables:</strong>{" "}
      {inspectionSummary.notApplicableLabels.length > 0
        ? inspectionSummary.notApplicableLabels.join(", ")
        : "Ninguno"}
    </div>
  </div>
)}

{allSectionsReviewed ? (
  <button
    type="button"
    onClick={saveInspection}
    disabled={saving}
    className="w-full bg-green-700 text-white py-3 rounded font-semibold disabled:opacity-50"
  >
    {saving ? "Guardando..." : "Guardar inspección ambiental"}
  </button>
) : (
  <div className="border border-yellow-300 bg-yellow-50 text-yellow-800 rounded p-3 text-sm">
    Debes revisar y finalizar todos los módulos antes de guardar la inspección.
  </div>
)}

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

{viewMode === "detail" && selectedRecord && (
  <section className="border rounded-xl p-6 bg-white shadow-sm space-y-4">
    <div className="flex justify-between gap-3">
      <button
        type="button"
        onClick={() => setViewMode("list")}
        className="border rounded px-4 py-2 no-print"
      >
        ← Volver al listado
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className="bg-black text-white rounded px-4 py-2 no-print"
      >
        Generar PDF
      </button>
    </div>

    <h2 className="text-2xl font-bold">
      Reporte de inspección ambiental
    </h2>
<div className="border-2 border-black mb-4 text-[10px] leading-tight">
  

  <div className="grid grid-cols-12 border-b">
  <div className="col-span-8">

    <div className="grid grid-cols-2 border-b">
      <div className="border-r p-1 font-semibold">
        Título del sistema:
      </div>
      <div className="p-1">
        Gestión HSSEQ
      </div>
    </div>

    <div className="grid grid-cols-2 border-b">
      <div className="border-r p-1 font-semibold">
        Nombre del formato:
      </div>
      <div className="p-1">
        Inspección Ambiental
      </div>
    </div>

    <div className="grid grid-cols-2">
      <div className="border-r p-1 font-semibold">
        No. de formato:
      </div>
      <div className="p-1">
        02-02-100 F 002
      </div>
    </div>

  </div>
    <div className="col-span-4 flex items-center justify-center border-l p-1">
      <img
        src="/logo-eies.png"
        alt="Estrella"
        className="max-h-10 object-contain"
      />
    </div>
  </div>

  <div className="grid grid-cols-5">
    <div className="border-r p-1">
     <div className="font-semibold">
        Fecha de emisión
      </div>
      <div>13/01/2025</div>
    </div>

    <div className="border-r p-1">
      <div className="font-semibold">
        No. Revisión
      </div>
      <div>1</div>
    </div>

    <div className="border-r p-1">
      <div className="font-semibold">
        Preparado por
      </div>
      <div>HSSEQ</div>
    </div>

    <div className="border-r p-1">
     <div className="font-semibold">
        Aprobado por
      </div>
      <div>JMC</div>
    </div>

    <div className="p-1">
      <div className="font-semibold">
        Página
      </div>
      <div>1 de 1</div>
    </div>
  </div>
</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div><strong>Fecha:</strong> {selectedRecord.inspection_date}</div>
      <div><strong>Inspector:</strong> {selectedRecord.inspector_name}</div>
      <div><strong>Operadora:</strong> {selectedRecord.operator}</div>
      <div><strong>Ubicación:</strong> {selectedRecord.location}</div>
      <div><strong>Sitio específico:</strong> {selectedRecord.specific_site}</div>
      <div><strong>Resultado:</strong> {selectedRecord.result}</div>
    </div>
<div className="mt-8">
  <h3 className="text-lg font-bold mb-4">
    1. Orden y Aseo
  </h3>

  <div className="overflow-x-auto">
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-neutral-100">
          <th className="border p-2 text-left">Ítem</th>
          <th className="border p-2 text-center w-20">C</th>
          <th className="border p-2 text-center w-20">NC</th>
          <th className="border p-2 text-center w-20">N/A</th>
          <th className="border p-2 text-left">Observación</th>
        </tr>
      </thead>

      <tbody>
        {selectedRecord.order_cleanliness?.map((item: any, index: number) => (
          <tr key={index}>
            <td className="border p-2">{item.question}</td>
            <td className="border p-2 text-center">{item.answer === "CUMPLE" ? "☑" : "☐"}</td>
            <td className="border p-2 text-center">{item.answer === "NO CUMPLE" ? "☑" : "☐"}</td>
            <td className="border p-2 text-center">{item.answer === "NA" ? "☑" : "☐"}</td>
            <td className="border p-2">{item.observation || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
<div className="mt-8">
  <h3 className="text-lg font-bold mb-4">
    2. Kit Ambiental
  </h3>

  <div className="overflow-x-auto">
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-neutral-100">
          <th className="border p-2 text-left">Elemento</th>
          <th className="border p-2 text-center">Disponible</th>
          <th className="border p-2 text-center">No disponible</th>
          <th className="border p-2 text-center">Bueno</th>
          <th className="border p-2 text-center">Malo</th>
          <th className="border p-2 text-center">Reemplazar</th>
          <th className="border p-2 text-center">Cantidad</th>
          <th className="border p-2 text-left">Observación</th>
        </tr>
      </thead>

      <tbody>
        {selectedRecord.environmental_kit?.map(
          (item: any, index: number) => (
            <tr key={index}>
              <td className="border p-2">
                {item.item}
              </td>

              <td className="border p-2 text-center">
                {item.available === "SI" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.available === "NO" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.status === "B" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.status === "M" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.status === "RC" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.quantity || "-"}
              </td>

              <td className="border p-2">
                {item.observation || "-"}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  </div>
</div>
<div className="mt-8">
  <h3 className="text-lg font-bold mb-4">
    3. Punto Ecológico
  </h3>

  <div className="overflow-x-auto">
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-neutral-100">
          <th className="border p-2 text-left">Ítem</th>
          <th className="border p-2 text-center w-20">C</th>
          <th className="border p-2 text-center w-20">NC</th>
          <th className="border p-2 text-center w-20">N/A</th>
          <th className="border p-2 text-left">Observación</th>
        </tr>
      </thead>

      <tbody>
        {selectedRecord.ecological_point?.map((item: any, index: number) => (
          <tr key={index}>
            <td className="border p-2">{item.item}</td>
            <td className="border p-2 text-center">{item.answer === "CUMPLE" ? "☑" : "☐"}</td>
            <td className="border p-2 text-center">{item.answer === "NO CUMPLE" ? "☑" : "☐"}</td>
            <td className="border p-2 text-center">{item.answer === "NA" ? "☑" : "☐"}</td>
            <td className="border p-2">{item.observation || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
<div className="mt-8">
  <h3 className="text-lg font-bold mb-4">
    4. Almacenamiento de Sustancias Químicas
  </h3>

  <div className="overflow-x-auto">
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-neutral-100">
          <th className="border p-2 text-left">Ítem</th>
          <th className="border p-2 text-center w-20">C</th>
          <th className="border p-2 text-center w-20">NC</th>
          <th className="border p-2 text-center w-20">N/A</th>
          <th className="border p-2 text-left">Observación</th>
        </tr>
      </thead>

      <tbody>
        {selectedRecord.chemical_storage?.map((item: any, index: number) => (
          <tr key={index}>
            <td className="border p-2">{item.item}</td>
            <td className="border p-2 text-center">
              {item.answer === "CUMPLE" ? "☑" : "☐"}
            </td>
            <td className="border p-2 text-center">
              {item.answer === "NO CUMPLE" ? "☑" : "☐"}
            </td>
            <td className="border p-2 text-center">
              {item.answer === "NA" ? "☑" : "☐"}
            </td>
            <td className="border p-2">
              {item.observation || "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
<div className="mt-8">
  <h3 className="text-lg font-bold mb-4">
    5. Baños
  </h3>

  {selectedRecord.bathrooms?.map(
    (bathroom: any, bathroomIndex: number) => (
      <div key={bathroomIndex} className="mb-6">

        <h4 className="font-semibold mb-2">
          {bathroom.bathroom}
        </h4>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border p-2 text-left">Ítem</th>
              <th className="border p-2 text-center w-20">BE</th>
              <th className="border p-2 text-center w-20">ME</th>
              <th className="border p-2 text-center w-20">N/A</th>
              <th className="border p-2 text-left">Observación</th>
            </tr>
          </thead>

          <tbody>
            {bathroom.items?.map(
              (item: any, itemIndex: number) => (
                <tr key={itemIndex}>
                  <td className="border p-2">
                    {item.item}
                  </td>

                  <td className="border p-2 text-center">
                    {item.status === "BE" ? "☑" : "☐"}
                  </td>

                  <td className="border p-2 text-center">
                    {item.status === "ME" ? "☑" : "☐"}
                  </td>

                  <td className="border p-2 text-center">
                    {item.status === "NA" ? "☑" : "☐"}
                  </td>

                  <td className="border p-2">
                    {item.observation || "-"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

      </div>
    )
  )}
</div>
<div className="mt-8">
  <h3 className="text-lg font-bold mb-4">
    6. Planta de tratamiento de agua
  </h3>

  <div className="overflow-x-auto">
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-neutral-100">
          <th className="border p-2 text-left">Ítem</th>
          <th className="border p-2 text-center w-20">C</th>
          <th className="border p-2 text-center w-20">NC</th>
          <th className="border p-2 text-center w-20">N/A</th>
          <th className="border p-2 text-left">Observación</th>
        </tr>
      </thead>

      <tbody>
        {selectedRecord.water_treatment?.map(
          (item: any, index: number) => (
            <tr key={index}>
              <td className="border p-2">
                {item.item}
              </td>

              <td className="border p-2 text-center">
                {item.answer === "CUMPLE" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.answer === "NO CUMPLE" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.answer === "NA" ? "☑" : "☐"}
              </td>

              <td className="border p-2">
                {item.observation || "-"}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  </div>
</div>
<div className="mt-8">
  <h3 className="text-lg font-bold mb-4">
    7. Red hidráulica
  </h3>

  <div className="overflow-x-auto">
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-neutral-100">
          <th className="border p-2 text-left">Ítem</th>
          <th className="border p-2 text-center w-20">C</th>
          <th className="border p-2 text-center w-20">NC</th>
          <th className="border p-2 text-center w-20">N/A</th>
          <th className="border p-2 text-left">Observación</th>
        </tr>
      </thead>

      <tbody>
        {selectedRecord.hydraulic_network?.map(
          (item: any, index: number) => (
            <tr key={index}>
              <td className="border p-2">
                {item.item}
              </td>

              <td className="border p-2 text-center">
                {item.answer === "CUMPLE" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.answer === "NO CUMPLE" ? "☑" : "☐"}
              </td>

              <td className="border p-2 text-center">
                {item.answer === "NA" ? "☑" : "☐"}
              </td>

              <td className="border p-2">
                {item.observation || "-"}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  </div>
</div>

{selectedRecord.signature_url && (
  <div className="mt-10 pt-6 border-t">
    <div className="font-semibold mb-2">
      Firma del inspector
    </div>

    <img
      src={selectedRecord.signature_url}
      alt="Firma inspector"
      className="max-h-28 object-contain border"
    />

    <div className="mt-2 text-sm">
      {selectedRecord.inspector_name || "Inspector"}
    </div>
  </div>
)}
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

           <div className="space-y-3">
  <div className="font-bold text-lg">
    Inspecciones registradas
  </div>

  {records.length === 0 && (
    <div className="text-sm text-neutral-500">
      No hay inspecciones registradas.
    </div>
  )}

{records.map((record) => (
  <button
    key={record.id}
    type="button"
    onClick={() => {
      setSelectedRecord(record);
      setViewMode("detail");
    }}
    className="w-full text-left border rounded-xl p-4 bg-white shadow-sm space-y-2 hover:bg-neutral-50"
  >
    <div className="font-bold">
      {record.inspection_date || "Sin fecha"} — {record.result || "Sin resultado"}
    </div>

    <div className="text-sm text-neutral-600">
      Inspector: {record.inspector_name || "No registrado"}
    </div>

    <div className="text-sm text-neutral-600">
      Ubicación: {record.location || "No registrada"}
    </div>

    <div className="text-sm text-neutral-600">
      Sitio específico: {record.specific_site || "No registrado"}
    </div>
  </button>
))}

</div>

          </section>
        )}

      </div>
    </main>
  );
}