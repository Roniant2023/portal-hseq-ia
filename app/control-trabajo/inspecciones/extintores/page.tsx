"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type ViewMode =
  | "menu"
  | "newExtinguisher"
  | "monthlyInspection"
  | "list"
  | "editExtinguisher";

type ExtinguisherInspection = {
  id: string;
  created_at: string;
  inspection_date: string;
  inspector_name: string;
  location: string;
  location_other: string;
  well_services_unit: string;
  extinguisher_code: string;
  brand: string;
  class: string;
  type: string;
  capacity: string;
  charge_expiry_date: string;
  hydrostatic_test_date: string;
  hydrostatic_expiry_date: string;
  cylinder_status: string;
  gauge_status: string;
  pressure_status: string;
  hose_status: string;
  nozzle_status: string;
  trigger_status: string;
  seal_status: string;
  located_at: string;
  observations: string;
  result: string;
  action_required: string;
  photo_url: string;
};
type FireExtinguisher = {
  id: string;
  created_at: string;
  extinguisher_code: string;
  location: string;
well_services_unit: string;
  specific_site: string;
  brand: string;
  class: string;
  type: string;
  capacity: string;
  charge_expiry_date: string;
  hydrostatic_test_date: string;
  hydrostatic_expiry_date: string;
  status: string;
  photo_url: string;
};

const emptyForm = {
  inspection_date: "",
  inspector_name: "",
  location: "",
  location_other: "",
  well_services_unit: "",
  extinguisher_code: "",
  brand: "",
  class: "",
  type: "",
  capacity: "",
  charge_expiry_date: "",
  hydrostatic_test_date: "",
  hydrostatic_expiry_date: "",
  cylinder_status: "B",
  gauge_status: "B",
  pressure_status: "B",
  hose_status: "B",
  nozzle_status: "B",
  trigger_status: "B",
  seal_status: "B",
  located_at: "",
  observations: "",
  result: "",
  action_required: "",
  photo_url: "",
};

const WELL_SERVICES_UNITS = [
  "CA101",
  "CR102",
  "CR103",
  "CR104",
  "CR111",
  "CR106",
  "CR107",
  "CMR108",
  "CMR109",
  "CMR110",
  "MCR101",
  "MCR102",
  "MCR103",
  "MCR104",
  "BR101",
  "BR102",
  "BR103",
  "TR101",
  "TR102",
  "TR103",
  "FT46948",
  "FT5700",
  "FT46950",
  "CTR101",
  "CTR102",
  "CABAJA47742",
  "CAALTA46229",
  "CAALTA21380",
  "CAALTA31404",
];

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-neutral-600">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ExtintoresPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("menu");
  const [form, setForm] = useState(emptyForm);
  const [records, setRecords] = useState<ExtinguisherInspection[]>([]);
const [extinguishers, setExtinguishers] = useState<FireExtinguisher[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uiInfo, setUiInfo] = useState("");
  const [uiError, setUiError] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [locationFilter, setLocationFilter] = useState("");
const [resultFilter, setResultFilter] = useState("");
const [monthlyLocation, setMonthlyLocation] = useState("");
const [monthlyUnit, setMonthlyUnit] = useState("");
const [monthlyDate, setMonthlyDate] = useState("");
const [monthlyInspector, setMonthlyInspector] = useState("");
const [monthlyCodeSearch, setMonthlyCodeSearch] = useState("");
const [monthlyItems, setMonthlyItems] = useState<any[]>([]);
const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);

const [selectedExtinguisher, setSelectedExtinguisher] =
  useState<FireExtinguisher | null>(null);
const [editPassword, setEditPassword] = useState("");
const [pendingEditItem, setPendingEditItem] =
  useState<FireExtinguisher | null>(null);
  function updateField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function loadRecords() {
    const { data, error } = await supabase
      .from("fire_extinguisher_inspections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setUiError(error.message);
      return;
    }

    setRecords((data || []) as ExtinguisherInspection[]);
  }

async function loadExtinguishers() {
  const { data, error } = await supabase
    .from("fire_extinguishers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    setUiError(error.message);
    return;
  }

  setExtinguishers((data || []) as FireExtinguisher[]);
}

async function loadMonthlyRecords() {
  const { data, error } = await supabase
    .from("fire_extinguisher_monthly_inspections")
    .select("*")
    .order("inspection_date", { ascending: false });

  if (error) {
    setUiError(error.message);
    return;
  }

  setMonthlyRecords(data || []);
}
async function uploadPhoto() {
  if (!photoFile) return "";

  const cleanFileName = photoFile.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_");

  const path = `extintores/${Date.now()}-${cleanFileName}`;

  const { error } = await supabase.storage
    .from("hseq-inspections")
    .upload(path, photoFile, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from("hseq-inspections")
    .getPublicUrl(path);

  return data.publicUrl;
}

function calculateResult() {
  const statuses = [
    form.cylinder_status,
    form.gauge_status,
    form.pressure_status,
    form.hose_status,
    form.nozzle_status,
    form.trigger_status,
    form.seal_status,
  ];

  return statuses.includes("M") ? "NO CUMPLE" : "CUMPLE";
}

async function saveExtinguisher() {
  try {
    setSaving(true);
    setUiError("");
    setUiInfo("");

    if (!form.extinguisher_code.trim()) {
      setUiError("Debes diligenciar el código del extintor.");
      return;
    }

    const photoUrl = await uploadPhoto();

    const payload = {
      extinguisher_code: form.extinguisher_code,
location:
  form.location === "Otros"
    ? form.location_other
    : form.location,

well_services_unit:
  form.location === "Well Services"
    ? form.well_services_unit
    : "",

specific_site: form.located_at,     

      brand: form.brand,
      class: form.class,
      type: form.type,
      capacity: form.capacity,
      charge_expiry_date: form.charge_expiry_date,
      hydrostatic_test_date: form.hydrostatic_test_date,
      hydrostatic_expiry_date: form.hydrostatic_expiry_date,
      status: "ACTIVE",
      photo_url: photoUrl || form.photo_url,
    };

    const { error } = await supabase
      .from("fire_extinguishers")
      .insert(payload);

    if (error) {
      setUiError(error.message);
      return;
    }

    setUiInfo("✅ Extintor registrado correctamente.");
    setForm(emptyForm);
    setPhotoFile(null);
await loadExtinguishers();
    setViewMode("list");
  } catch (err: any) {
    setUiError(err?.message || "Error registrando extintor.");
  } finally {
    setSaving(false);
  }
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

    if (!form.extinguisher_code.trim()) {
      setUiError("Debes diligenciar el código del extintor.");
      return;
    }

    const photoUrl = await uploadPhoto();
    const result = calculateResult();

    const payload = {
      ...form,
      location:
        form.location === "Well Services"
          ? `Well Services - ${form.well_services_unit || ""}`
          : form.location === "Otros"
          ? form.location_other
          : form.location,
      result,
      photo_url: photoUrl || form.photo_url,
    };

    const { error } = await supabase
      .from("fire_extinguisher_inspections")
      .insert(payload);

    if (error) {
      setUiError(error.message);
      return;
    }

    setUiInfo("✅ Inspección de extintor guardada correctamente.");
    setForm(emptyForm);
    setPhotoFile(null);
    await loadRecords();
    setViewMode("list");
  } catch (err: any) {
    setUiError(err?.message || "Error guardando inspección.");
  } finally {
    setSaving(false);
  }
}

function getLastDayOfMonth(monthValue: string) {
  if (!monthValue) return "";

  const [year, month] = monthValue.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();

  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function getMonthValueFromDate(dateValue: string) {
  if (!dateValue) return "";
  return dateValue.slice(0, 7);
}

function addFiveYearsToMonthEnd(monthValue: string) {
  if (!monthValue) return "";

  const [year, month] = monthValue.split("-").map(Number);
  const targetYear = year + 5;
  const lastDay = new Date(targetYear, month, 0).getDate();

  return `${targetYear}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

 useEffect(() => {
  loadRecords();
  loadExtinguishers();
  loadMonthlyRecords();
}, []);

const filteredRecords = records.filter((item) => {
  const term = searchTerm.trim().toLowerCase();

  const searchableText = [
    item.extinguisher_code,
    item.location,
    item.well_services_unit,
    item.brand,
    item.class,
    item.type,
    item.capacity,
    item.located_at,
    item.result,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchesSearch =
    !term || searchableText.includes(term);

  const matchesLocation =
    !locationFilter ||
    String(item.location || "")
      .toLowerCase()
      .includes(locationFilter.toLowerCase());

  const matchesResult =
    !resultFilter || item.result === resultFilter;

  return (
    matchesSearch &&
    matchesLocation &&
    matchesResult
  );
});

function getLastInspectionDate(code: string) {
  const found = monthlyRecords.find(
    (item) =>
      String(item.extinguisher_code || "").trim().toLowerCase() ===
      String(code || "").trim().toLowerCase()
  );

  return found?.inspection_date || "";
}

const filteredExtinguishers = extinguishers.filter((item) => {
  const term = searchTerm.trim().toLowerCase();

  const searchableText = [
    item.extinguisher_code,
    item.location,
    item.specific_site,
    item.brand,
    item.class,
    item.type,
    item.capacity,
    item.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return !term || searchableText.includes(term);
});

function loadMonthlyItemsByLocation(
  location: string,
  unit?: string
) {
  const items = extinguishers
    .filter((item) => {
      if (location === "Well Services") {
        return (
          item.location === "Well Services" &&
          item.well_services_unit === unit
        );
      }

      return item.location === location;
    })
    
.map((item) => ({
  ...item,

  registered_location: item.location,
  registered_well_services_unit:
    item.well_services_unit || "",

  found_location: item.location,
  found_well_services_unit:
    item.well_services_unit || "",

  cylinder_status: "B",
  gauge_status: "B",
  pressure_status: "B",
  hose_status: "B",
  nozzle_status: "B",
  trigger_status: "B",
  seal_status: "B",
  observations: "",
  result: "CUMPLE",
}))

  setMonthlyItems(items);
}
function loadMonthlyItemByCode(code: string) {
  const cleanCode = code.trim().toLowerCase();

  if (!cleanCode) return;

  const found = extinguishers.find(
    (item) =>
      String(item.extinguisher_code || "")
        .trim()
        .toLowerCase() === cleanCode
  );

  if (!found) {
    setUiError("No se encontró ningún extintor con ese código.");
    return;
  }

  setUiError("");

  const itemToInspect = {
    ...found,

    registered_location: found.location,
    registered_well_services_unit:
      found.well_services_unit || "",

    found_location: found.location,
found_well_services_unit: found.well_services_unit || "",

    cylinder_status: "B",
    gauge_status: "B",
    pressure_status: "B",
    hose_status: "B",
    nozzle_status: "B",
    trigger_status: "B",
    seal_status: "B",
    observations: "",
    result: "CUMPLE",
  };

  setMonthlyItems([itemToInspect]);
setMonthlyCodeSearch("");
}
function openEditExtinguisher(item: FireExtinguisher) {
  setSelectedExtinguisher(item);

  setForm({
    ...emptyForm,
    extinguisher_code: item.extinguisher_code || "",
    location: item.location || "",
    well_services_unit: item.well_services_unit || "",
    located_at: item.specific_site || "",
    brand: item.brand || "",
    class: item.class || "",
    type: item.type || "",
    capacity: item.capacity || "",
    charge_expiry_date: item.charge_expiry_date || "",
    hydrostatic_test_date: item.hydrostatic_test_date || "",
    hydrostatic_expiry_date: item.hydrostatic_expiry_date || "",
    photo_url: item.photo_url || "",
  });

  setPhotoFile(null);
  setViewMode("editExtinguisher");
}

function requestEditExtinguisher(item: FireExtinguisher) {
  setPendingEditItem(item);
  setEditPassword("");
  setUiError("");
}

function confirmEditPassword() {
  if (editPassword !== "Estrella2026100%") {
    setUiError("Clave incorrecta.");
    return;
  }

  if (pendingEditItem) {
    openEditExtinguisher(pendingEditItem);
  }

  setPendingEditItem(null);
  setEditPassword("");
  setUiError("");
}

async function updateExtinguisher() {
  try {
    setSaving(true);
    setUiError("");
    setUiInfo("");

    if (!selectedExtinguisher) {
      setUiError("No hay extintor seleccionado para editar.");
      return;
    }

    if (!form.extinguisher_code.trim()) {
      setUiError("Debes diligenciar el código del extintor.");
      return;
    }

    const photoUrl = await uploadPhoto();

    const payload = {
  extinguisher_code: form.extinguisher_code,
  location:
    form.location === "Otros"
      ? form.location_other
      : form.location,
  well_services_unit:
    form.location === "Well Services"
      ? form.well_services_unit
      : "",
  specific_site: form.located_at,
  brand: form.brand,
  class: form.class,
  type: form.type,
  capacity: form.capacity,
  charge_expiry_date: form.charge_expiry_date,
  hydrostatic_test_date: form.hydrostatic_test_date,
  hydrostatic_expiry_date: form.hydrostatic_expiry_date,
  status: form.result || "ACTIVE",
  photo_url: photoUrl || form.photo_url,
};

    const { error } = await supabase
      .from("fire_extinguishers")
      .update(payload)
      .eq("id", selectedExtinguisher.id);

    if (error) {
      setUiError(error.message);
      return;
    }

    setUiInfo("✅ Extintor actualizado correctamente.");
    setSelectedExtinguisher(null);
    setForm(emptyForm);
    setPhotoFile(null);
    await loadExtinguishers();
    setViewMode("list");
  } catch (err: any) {
    setUiError(err?.message || "Error actualizando extintor.");
  } finally {
    setSaving(false);
  }
}
async function saveMonthlyInspection() {
  try {
    setSaving(true);
    setUiError("");
    setUiInfo("");

    if (!monthlyDate) {
      setUiError("Debes seleccionar la fecha de inspección.");
      return;
    }

    if (!monthlyInspector.trim()) {
      setUiError("Debes diligenciar el inspector.");
      return;
    }

    if (monthlyItems.length === 0) {
      setUiError("No hay extintores cargados para inspeccionar.");
      return;
    }

    const payload = monthlyItems.map((item) => {
      const statuses = [
        item.cylinder_status,
        item.gauge_status,
        item.pressure_status,
        item.hose_status,
        item.nozzle_status,
        item.trigger_status,
        item.seal_status,
      ];

 return {
  inspection_date: monthlyDate,
  inspector_name: monthlyInspector,

  location: item.found_location || item.location,
  extinguisher_code: item.extinguisher_code,

  registered_location: item.registered_location || item.location,
  registered_well_services_unit:
    item.registered_well_services_unit || "",

  found_location: item.found_location || item.location,
  found_well_services_unit:
    item.found_well_services_unit || "",

  cylinder_status: item.cylinder_status,
  gauge_status: item.gauge_status,
  pressure_status: item.pressure_status,
  hose_status: item.hose_status,
  nozzle_status: item.nozzle_status,
  trigger_status: item.trigger_status,
  seal_status: item.seal_status,
  observations: item.observations || "",
  result: statuses.includes("M") ? "NO CUMPLE" : "CUMPLE",
};
    });

    const { error } = await supabase
      .from("fire_extinguisher_monthly_inspections")
      .insert(payload);

    if (error) {
      setUiError(error.message);
      return;
    }

for (const item of monthlyItems) {
  await supabase
    .from("fire_extinguishers")
    .update({
      location: item.found_location || item.location,
      well_services_unit:
        item.found_location === "Well Services"
          ? item.found_well_services_unit || ""
          : "",
    })
    .eq("id", item.id);
}

    setMonthlyItems([]);
setMonthlyCodeSearch("");
await loadMonthlyRecords();
await loadExtinguishers();
setUiInfo(
  "✅ Inspección guardada correctamente. Busca el siguiente extintor."
);
  } catch (err: any) {
    setUiError(err?.message || "Error guardando inspección mensual.");
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
            Inspección de Extintores
          </h1>

          <p className="text-sm text-neutral-600">
            Registro, consulta y seguimiento de extintores.
          </p>
        </div>

        {(uiError || uiInfo) && (
          <div
            className={`border rounded p-3 text-sm ${
              uiError
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            {uiError || uiInfo}
          </div>
        )}

{pendingEditItem && (
  <div className="border rounded-xl p-4 bg-yellow-50 space-y-3">
    <div className="font-semibold">
      Confirmar edición
    </div>

    <div className="text-sm text-neutral-700">
      Digita la clave para editar el extintor{" "}
      <b>{pendingEditItem.extinguisher_code}</b>.
    </div>

    <input
      type="password"
      className="border p-2 rounded w-full"
      placeholder="Clave de edición"
      value={editPassword}
      onChange={(e) => setEditPassword(e.target.value)}
    />

    <div className="flex gap-2">
      <button
        type="button"
        onClick={confirmEditPassword}
        className="bg-black text-white rounded px-4 py-2 text-sm"
      >
        Confirmar
      </button>

      <button
        type="button"
        onClick={() => {
          setPendingEditItem(null);
          setEditPassword("");
          setUiError("");
        }}
        className="border rounded px-4 py-2 text-sm bg-white"
      >
        Cancelar
      </button>
    </div>
  </div>
)}

{viewMode === "menu" && (
  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <button
      type="button"
      onClick={() => setViewMode("newExtinguisher")}
      className="border rounded-2xl p-6 bg-white shadow-sm text-left hover:shadow-md transition"
    >
      <div className="text-2xl font-bold">
        Registrar extintor
      </div>

      <div className="text-sm text-neutral-600 mt-2">
        Crear el activo maestro del extintor.
      </div>
    </button>

    <button
      type="button"
      onClick={() => setViewMode("monthlyInspection")}
      className="border rounded-2xl p-6 bg-white shadow-sm text-left hover:shadow-md transition"
    >
      <div className="text-2xl font-bold">
        Inspección mensual
      </div>

      <div className="text-sm text-neutral-600 mt-2">
        Inspeccionar un extintor ya registrado.
      </div>
    </button>

    <button
      type="button"
      onClick={() => setViewMode("list")}
      className="border rounded-2xl p-6 bg-white shadow-sm text-left hover:shadow-md transition"
    >
      <div className="text-2xl font-bold">
        Consultar extintores
      </div>

      <div className="text-sm text-neutral-600 mt-2">
        Buscar por código, ubicación, tipo o resultado.
      </div>
    </button>
  </section>
)}       

{viewMode === "newExtinguisher" && (
  <section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
    <div className="bg-red-700 text-white text-center font-bold py-2 rounded">
      INSPECCIÓN DE EXTINTORES
    </div>

    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => setViewMode("menu")}
        className="border rounded px-4 py-2 text-sm bg-white"
      >
        ← Volver al menú
      </button>


    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Field label="Fecha de registro">
        <input
          type="date"
          className="border p-2 rounded"
          value={form.inspection_date}
          onChange={(e) => updateField("inspection_date", e.target.value)}
        />
      </Field>


      <Field label="Código / No.">
        <input
          className="border p-2 rounded"
          value={form.extinguisher_code}
          onChange={(e) => updateField("extinguisher_code", e.target.value)}
        />
      </Field>

      <Field label="Unidad Operativa / Departamento">
        <select
          className="border p-2 rounded"
          value={form.location}
          onChange={(e) => updateField("location", e.target.value)}
        >
          <option value="">Seleccione ubicación</option>
          <option value="Base Tocancipa">Base Tocancipa</option>
          <option value="Base Palermo">Base Palermo</option>
          <option value="Lote La Florida">Lote La Florida</option>
          <option value="Well Services">Well Services</option>
          <option value="Rig E2027">Rig E2027</option>
          <option value="Otros">Otros</option>
        </select>

        {form.location === "Well Services" && (
          <select
            className="border p-2 rounded mt-2"
            value={form.well_services_unit}
            onChange={(e) =>
              updateField("well_services_unit", e.target.value)
            }
          >
            <option value="">Seleccione unidad Well Services</option>
            {WELL_SERVICES_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        )}

        {form.location === "Otros" && (
          <input
            className="border p-2 rounded mt-2"
            placeholder="Especifique ubicación"
            value={form.location_other}
            onChange={(e) => updateField("location_other", e.target.value)}
          />
        )}
      </Field>

      <Field label="Ubicado en">
        <input
          className="border p-2 rounded"
          value={form.located_at}
          onChange={(e) => updateField("located_at", e.target.value)}
        />
      </Field>

      <Field label="Marca fábrica">
        <input
          className="border p-2 rounded"
          value={form.brand}
          onChange={(e) => updateField("brand", e.target.value)}
        />
      </Field>

      <Field label="Clase">
        <select
          className="border p-2 rounded"
          value={form.class}
          onChange={(e) => updateField("class", e.target.value)}
        >
          <option value="">Seleccione</option>
          <option value="ABC">ABC</option>
          <option value="BC">BC</option>
        </select>
      </Field>

      <Field label="Tipo">
        <select
          className="border p-2 rounded"
          value={form.type}
          onChange={(e) => updateField("type", e.target.value)}
        >
          <option value="">Seleccione</option>
          <option value="PQ">PQ</option>
          <option value="CO2">CO2</option>
        </select>
      </Field>

      <Field label="Capacidad">
        <input
          className="border p-2 rounded"
          value={form.capacity}
          onChange={(e) => updateField("capacity", e.target.value)}
        />
      </Field>

      <Field label="Vencimiento carga">
  <input
    type="month"
    className="border p-2 rounded"
    value={getMonthValueFromDate(form.charge_expiry_date)}
    onChange={(e) =>
      updateField("charge_expiry_date", getLastDayOfMonth(e.target.value))
    }
  />

  {form.charge_expiry_date && (
    <div className="text-xs text-neutral-500">
      Se guardará como: {form.charge_expiry_date}
    </div>
  )}
</Field>

      <Field label="Fecha P.H.">
  <input
    type="month"
    className="border p-2 rounded"
    value={getMonthValueFromDate(form.hydrostatic_test_date)}
    onChange={(e) => {
      const monthValue = e.target.value;

      updateField("hydrostatic_test_date", getLastDayOfMonth(monthValue));
      updateField("hydrostatic_expiry_date", addFiveYearsToMonthEnd(monthValue));
    }}
  />

  {form.hydrostatic_test_date && (
    <div className="text-xs text-neutral-500">
      Se guardará como: {form.hydrostatic_test_date}
    </div>
  )}
</Field>

<Field label="Vencimiento P.H.">
  <input
    type="date"
    className="border p-2 rounded bg-neutral-50"
    value={form.hydrostatic_expiry_date}
    readOnly
  />

  {form.hydrostatic_expiry_date && (
    <div className="text-xs text-neutral-500">
      Calculado automáticamente: {form.hydrostatic_expiry_date}
    </div>
  )}
</Field>    

    </div>

<div className="border rounded p-4 space-y-3">
  <div className="font-semibold">
    Estado del extintor
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    {[
      ["cylinder_status", "Cilindro"],
      ["gauge_status", "Manómetro"],
      ["pressure_status", "Presión"],
      ["hose_status", "Manguera"],
      ["nozzle_status", "Boquilla"],
      ["trigger_status", "Gatillo"],
      ["seal_status", "Precinto"],
    ].map(([key, label]) => (
      <Field key={key} label={label}>
        <select
          className="border p-2 rounded"
          value={(form as any)[key]}
          onChange={(e) => updateField(key, e.target.value)}
        >
          <option value="B">B - Bien</option>
          <option value="M">M - Mal</option>
          <option value="NA">N/A</option>
        </select>
      </Field>
    ))}
  </div>
</div>

<Field label="Observaciones">
  <textarea
    className="border p-2 rounded min-h-[100px]"
    value={form.observations}
    onChange={(e) => updateField("observations", e.target.value)}
  />
</Field>

<Field label="Acción requerida">
  <textarea
    className="border p-2 rounded min-h-[80px]"
    value={form.action_required}
    onChange={(e) => updateField("action_required", e.target.value)}
  />
</Field>

<div className="border rounded p-4 space-y-3">
  <div className="font-semibold">
    Foto del extintor
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-700">
        Tomar foto con cámara
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
        className="border p-2 rounded w-full"
      />
    </div>

    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-700">
        Cargar imagen desde galería
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
        className="border p-2 rounded w-full"
      />
    </div>

  </div>

  {photoFile && (
    <div className="text-sm text-green-700">
      ✅ Imagen seleccionada: {photoFile.name}
    </div>
  )}
</div>

<button
  type="button"
  onClick={saveExtinguisher}
  disabled={saving}
  className="w-full bg-black text-white py-3 rounded font-semibold disabled:opacity-50"
>
  {saving ? "Guardando..." : "Guardar extintor"}
</button>

  </section>
)}

{viewMode === "editExtinguisher" && (
  <section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
    <div className="bg-red-700 text-white text-center font-bold py-2 rounded">
      EDITAR EXTINTOR
    </div>

    <button
      type="button"
      onClick={() => setViewMode("list")}
      className="border rounded px-4 py-2 text-sm bg-white"
    >
      ← Volver a consulta
    </button>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Field label="Código / No.">
        <input className="border p-2 rounded" value={form.extinguisher_code}
          onChange={(e) => updateField("extinguisher_code", e.target.value)} />
      </Field>

      <Field label="Ubicación">
        <select className="border p-2 rounded" value={form.location}
          onChange={(e) => updateField("location", e.target.value)}>
          <option value="">Seleccione ubicación</option>
          <option value="Base Tocancipa">Base Tocancipa</option>
          <option value="Base Palermo">Base Palermo</option>
          <option value="Lote La Florida">Lote La Florida</option>
          <option value="Well Services">Well Services</option>
          <option value="Rig E2027">Rig E2027</option>
          <option value="Otros">Otros</option>
        </select>
      </Field>

      {form.location === "Well Services" && (
        <Field label="Unidad Well Services">
          <select className="border p-2 rounded" value={form.well_services_unit}
            onChange={(e) => updateField("well_services_unit", e.target.value)}>
            <option value="">Seleccione unidad</option>
            {WELL_SERVICES_UNITS.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Sitio específico">
        <input className="border p-2 rounded" value={form.located_at}
          onChange={(e) => updateField("located_at", e.target.value)} />
      </Field>

      <Field label="Marca">
        <input className="border p-2 rounded" value={form.brand}
          onChange={(e) => updateField("brand", e.target.value)} />
      </Field>

      <Field label="Clase">
        <select className="border p-2 rounded" value={form.class}
          onChange={(e) => updateField("class", e.target.value)}>
          <option value="">Seleccione</option>
          <option value="ABC">ABC</option>
          <option value="BC">BC</option>
        </select>
      </Field>

      <Field label="Tipo">
        <select className="border p-2 rounded" value={form.type}
          onChange={(e) => updateField("type", e.target.value)}>
          <option value="">Seleccione</option>
          <option value="PQ">PQ</option>
          <option value="CO2">CO2</option>
        </select>
      </Field>

      <Field label="Capacidad">
        <input className="border p-2 rounded" value={form.capacity}
          onChange={(e) => updateField("capacity", e.target.value)} />
      </Field>
<Field label="Vencimiento carga">
  <input
    type="month"
    className="border p-2 rounded"
    value={getMonthValueFromDate(form.charge_expiry_date)}
    onChange={(e) =>
      updateField("charge_expiry_date", getLastDayOfMonth(e.target.value))
    }
  />
  {form.charge_expiry_date && (
    <div className="text-xs text-neutral-500">
      Se guardará como: {form.charge_expiry_date}
    </div>
  )}
</Field>

<Field label="Fecha P.H.">
  <input
    type="month"
    className="border p-2 rounded"
    value={getMonthValueFromDate(form.hydrostatic_test_date)}
    onChange={(e) => {
      const monthValue = e.target.value;
      updateField("hydrostatic_test_date", getLastDayOfMonth(monthValue));
      updateField("hydrostatic_expiry_date", addFiveYearsToMonthEnd(monthValue));
    }}
  />
</Field>

<Field label="Vencimiento P.H.">
  <input
    type="date"
    className="border p-2 rounded bg-neutral-50"
    value={form.hydrostatic_expiry_date}
    readOnly
  />
</Field>

<Field label="Estado">
  <select
    className="border p-2 rounded"
    value={form.result || "ACTIVE"}
    onChange={(e) => updateField("result", e.target.value)}
  >
    <option value="ACTIVE">Activo</option>
    <option value="OUT_OF_SERVICE">Fuera de servicio</option>
    <option value="RETIRED">Retirado</option>
  </select>
</Field>
  
</div>

<div className="border rounded p-4 space-y-3">
  <div className="font-semibold">
    Foto del extintor
  </div>

  {form.photo_url ? (
    <img
      src={form.photo_url}
      alt={form.extinguisher_code}
      className="h-40 w-full object-contain border rounded bg-neutral-50"
    />
  ) : (
    <div className="h-40 border rounded bg-neutral-50 flex items-center justify-center text-sm text-neutral-500">
      Sin foto actual
    </div>
  )}

  <input
    type="file"
    accept="image/*"
    capture="environment"
    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
    className="border p-2 rounded w-full"
  />

  {photoFile && (
    <div className="text-sm text-green-700">
      ✅ Nueva imagen seleccionada: {photoFile.name}
    </div>
  )}
</div>

<button
  type="button"
  onClick={updateExtinguisher}

      disabled={saving}
      className="w-full bg-black text-white py-3 rounded font-semibold disabled:opacity-50"
    >
      {saving ? "Actualizando..." : "Guardar cambios"}
    </button>
  </section>
)}


{viewMode === "monthlyInspection" && (
  <section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
    <div className="bg-red-700 text-white text-center font-bold py-2 rounded">
      INSPECCIÓN MENSUAL DE EXTINTORES
    </div>

    <button
      type="button"
      onClick={() => setViewMode("menu")}
      className="border rounded px-4 py-2 text-sm bg-white"
    >
      ← Volver al menú
    </button>
<div className="border rounded-xl p-4 bg-neutral-50 space-y-3">
  <div className="font-semibold">
    Buscar extintor por código
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <input
      className="border p-2 rounded md:col-span-2"
      placeholder="Digite el código del extintor"
      value={monthlyCodeSearch}
      onChange={(e) => setMonthlyCodeSearch(e.target.value)}
    />

   <button
  type="button"
  onClick={() => loadMonthlyItemByCode(monthlyCodeSearch)}
  className="bg-black text-white rounded px-4 py-2 font-medium"
>
  Buscar extintor
</button>
  </div>

  <div className="text-xs text-neutral-500">
    Use este campo cuando el extintor encontrado no corresponde a la ubicación seleccionada.
  </div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  <Field label="Fecha de inspección">
    <input
      type="date"
      className="border p-2 rounded"
      value={monthlyDate}
      onChange={(e) => setMonthlyDate(e.target.value)}
    />
  </Field>

  <Field label="Inspeccionado por">
    <input
      className="border p-2 rounded"
      value={monthlyInspector}
      onChange={(e) => setMonthlyInspector(e.target.value)}
    />
  </Field>
</div>    
  
<div className="text-sm text-neutral-600">
  {monthlyItems.length > 0
    ? "Extintor listo para inspección"
    : "Busque un extintor por código"}
</div>

{monthlyItems.map((item, index) => (
  <div
    key={item.id}
    className="border rounded-xl p-4 bg-white space-y-3"
  >
    <div className="font-bold text-lg">
      {item.extinguisher_code}
    </div>

    <div className="text-sm text-neutral-600">
      {item.location}
    </div>

   <div className="text-sm">
  <b>Ubicación:</b>{" "}
  {item.location === "Well Services" && item.well_services_unit
    ? `Well Services - ${item.well_services_unit}`
    : item.location || "—"}
</div>
<div className="border rounded p-3 bg-neutral-50 space-y-3">
  <div className="text-sm font-semibold">
    Trazabilidad de ubicación
  </div>

  <div className="text-sm">
    <b>Ubicación registrada:</b>{" "}
    {item.registered_location || item.location || "—"}
  </div>

  {item.registered_well_services_unit && (
    <div className="text-sm">
      <b>Unidad registrada:</b>{" "}
      {item.registered_well_services_unit}
    </div>
  )}

  <Field label="Ubicación encontrada">
    <select
      className="border p-2 rounded"
      value={item.found_location || ""}
      onChange={(e) => {
        const updated = [...monthlyItems];

        updated[index] = {
          ...updated[index],
          found_location: e.target.value,
          found_well_services_unit:
            e.target.value === "Well Services"
              ? updated[index].found_well_services_unit || ""
              : "",
        };

        setMonthlyItems(updated);
      }}
    >
      <option value="">Seleccione ubicación</option>
      <option value="Base Tocancipa">Base Tocancipa</option>
      <option value="Base Palermo">Base Palermo</option>
      <option value="Lote La Florida">Lote La Florida</option>
      <option value="Well Services">Well Services</option>
      <option value="Rig E2027">Rig E2027</option>
      <option value="Otros">Otros</option>
    </select>
  </Field>

  {item.found_location === "Well Services" && (
    <Field label="Unidad encontrada">
      <select
        className="border p-2 rounded"
        value={item.found_well_services_unit || ""}
        onChange={(e) => {
          const updated = [...monthlyItems];

          updated[index] = {
            ...updated[index],
            found_well_services_unit: e.target.value,
          };

          setMonthlyItems(updated);
        }}
      >
        <option value="">Seleccione unidad</option>
        {WELL_SERVICES_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </Field>
  )}
</div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        ["cylinder_status", "Cilindro"],
        ["gauge_status", "Manómetro"],
        ["pressure_status", "Presión"],
        ["hose_status", "Manguera"],
        ["nozzle_status", "Boquilla"],
        ["trigger_status", "Gatillo"],
        ["seal_status", "Precinto"],
      ].map(([field, label]) => (
        <div key={field}>
          <label className="text-xs font-medium">
            {label}
          </label>

          <select
            className="border p-2 rounded w-full"
            value={item[field]}
            onChange={(e) => {
              const updated = [...monthlyItems];

              updated[index] = {
                ...updated[index],
                [field]: e.target.value,
              };

              setMonthlyItems(updated);
            }}
          >
            <option value="B">B - Bien</option>
            <option value="M">M - Mal</option>
            <option value="NA">N/A</option>
          </select>
        </div>
      ))}
    </div>

    <textarea
      className="border p-2 rounded w-full"
      placeholder="Observaciones"
      value={item.observations}
      onChange={(e) => {
        const updated = [...monthlyItems];

        updated[index] = {
          ...updated[index],
          observations: e.target.value,
        };

        setMonthlyItems(updated);
      }}
    />
  </div>
))}

<button
  type="button"
  onClick={saveMonthlyInspection}
  disabled={saving || monthlyItems.length === 0}
  className="w-full bg-red-700 text-white py-3 rounded font-semibold disabled:opacity-50"
>
  {saving ? "Guardando..." : "Guardar inspección mensual"}
</button>

  </section>
)}

{viewMode === "list" && (
  <section className="space-y-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="text-xl font-bold">
        Consulta de extintores
      </h2>

      <button
        type="button"
        onClick={() => setViewMode("menu")}
        className="border rounded px-4 py-2 text-sm"
      >
        ← Volver al menú
      </button>
    </div>

    <div className="border rounded-xl p-4 bg-white space-y-3">
      <div className="font-semibold">Filtros de consulta</div>

      <input
        className="border p-2 rounded w-full"
        placeholder="Buscar por código, ubicación, marca, clase, tipo o capacidad..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          className="border p-2 rounded"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">Todas las ubicaciones</option>
          <option value="Base Tocancipa">Base Tocancipa</option>
          <option value="Base Palermo">Base Palermo</option>
          <option value="Lote La Florida">Lote La Florida</option>
          <option value="Well Services">Well Services</option>
          <option value="Rig E2027">Rig E2027</option>
        </select>

        <select
          className="border p-2 rounded"
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
        >
          <option value="">Todos los resultados</option>
          <option value="CUMPLE">Cumple</option>
          <option value="NO CUMPLE">No cumple</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-neutral-600">
        <div>
Resultados: <b>{filteredExtinguishers.length}</b> de{" "}
<b>{extinguishers.length}</b>          

        </div>

        <button
          type="button"
          onClick={() => {
            setSearchTerm("");
            setLocationFilter("");
            setResultFilter("");
          }}
          className="border rounded px-3 py-1"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {filteredExtinguishers.map((item) => (
        <div
          key={item.id}
          className="border rounded-xl p-4 bg-white shadow-sm space-y-3"
        >
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.extinguisher_code}
              className="h-40 w-full object-contain border rounded bg-neutral-50"
            />
          ) : (
            <div className="h-40 border rounded bg-neutral-50 flex items-center justify-center text-sm text-neutral-500">
              Sin foto
            </div>
          )}

          <div>
            <div className="font-bold">
              {item.extinguisher_code || "Sin código"}
            </div>

            <div className="text-sm text-neutral-600">
              {item.class || "Sin clase"} · {item.type || "Sin tipo"} ·{" "}
              {item.capacity || "Sin capacidad"}
            </div>
          </div>

          <div className="text-sm">
            <b>Ubicación:</b> {item.location || "—"}
          </div>

          <div className="text-sm">
            <b>Sitio específico:</b> {item.specific_site || "—"}
          </div>
{item.location === "Well Services" && item.well_services_unit && (
  <div className="text-sm">
    <b>Unidad:</b> {item.well_services_unit}
  </div>
)}
          <div className="text-sm">
            <b>Estado:</b> {item.status || "—"}
          </div>

          <div className="text-sm">
            <b>Venc. carga:</b> {item.charge_expiry_date || "—"}
          </div>

          <div className="text-sm">
            <b>Venc. P.H.:</b> {item.hydrostatic_expiry_date || "—"}
          </div>
<div className="text-sm">
  <b>Última inspección:</b>{" "}
  {getLastInspectionDate(item.extinguisher_code) || "Sin registro"}
</div>

         <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-700 text-white">
  {item.status || "ACTIVE"}
</span>

<button
  type="button"
  onClick={() => requestEditExtinguisher(item)}
  className="w-full border rounded px-3 py-2 text-sm font-medium"
>
  Editar
</button>
          
        </div>
      ))}
    </div>
  </section>
)}

      </div>
    </main>
  );
}