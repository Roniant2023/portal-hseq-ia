"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const EDIT_PASSWORD = "Estrella2026100%";

type Equipment = {
  id: string;
  equipment_code: string;
  equipment_name: string;
  category: string;
  brand: string;
  model: string;
  internal_code: string;
  location: string;
  status: string;
  main_photo_url: string;
  service_start_date: string;
  last_certification_date: string;
  certification_validity_months: number;
  certification_expiry_date: string;
  technical_sheet_url: string;
  manufacturer_certification_url: string;
serial_number?: string;
  well_services_unit?: string;
};

const emptyForm = {
  equipment_code: "",
  location: "",
  location_other: "",
  well_services_unit: "",
  equipment_name: "",
  category: "",
  brand: "",
  model: "",
  internal_code: "",
  useful_life: "",
  service_start_date: "",
  last_certification_date: "",
  certification_validity_months: "12",
  certification_expiry_date: "",
  description: "",
  manufacturer: "",
  lot: "",
  capacity: "",
  serial_number: "",
  standard_compliance: "",
  prepared_by: "",
  service_area: "",
  person_in_charge: "",
  technical_sheet: false,
  manufacturer_certification: false,
  technical_sheet_url: "",
  manufacturer_certification_url: "",
  status: "IN_SERVICE",
  main_photo_url: "",
  gallery_urls: [] as string[],
};

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
      <label className="text-xs font-medium text-neutral-600">{label}</label>
      {children}
    </div>
  );
}

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

export default function HeightEquipmentPage() {
  const [form, setForm] = useState(emptyForm);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [technicalSheetFile, setTechnicalSheetFile] = useState<File | null>(
    null
  );
  const [manufacturerCertFile, setManufacturerCertFile] =
    useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uiInfo, setUiInfo] = useState("");
  const [uiError, setUiError] = useState("");
  const [viewMode, setViewMode] = useState<"menu" | "new" | "list">("menu");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [pendingEditItem, setPendingEditItem] = useState<Equipment | null>(
    null
  );
const [searchTerm, setSearchTerm] = useState("");
const [locationFilter, setLocationFilter] = useState("");
const [operationalStatusFilter, setOperationalStatusFilter] = useState("");
const [certificationFilter, setCertificationFilter] = useState("");

  function updateField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function calculateExpiryDate(date: string, months: string) {
    if (!date || !months) return "";

    const baseDate = new Date(date);
    baseDate.setMonth(baseDate.getMonth() + Number(months));

    return baseDate.toISOString().slice(0, 10);
  }

  function getCertificationStatus(expiryDate: string) {
    if (!expiryDate) {
      return {
        label: "SIN FECHA",
        className: "bg-neutral-500 text-white",
      };
    }

    const today = new Date();
    const expiry = new Date(expiryDate);

    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return {
        label: "CERTIFICACIÓN VENCIDA",
        className: "bg-black text-white",
      };
    }

    if (diffDays <= 15) {
      return {
        label: `VENCE EN ${diffDays} DÍAS`,
        className: "bg-red-600 text-white",
      };
    }

    if (diffDays <= 30) {
      return {
        label: `VENCE EN ${diffDays} DÍAS`,
        className: "bg-orange-500 text-white",
      };
    }

    if (diffDays <= 60) {
      return {
        label: `VENCE EN ${diffDays} DÍAS`,
        className: "bg-yellow-500 text-black",
      };
    }

    return {
      label: "CERTIFICACIÓN VIGENTE",
      className: "bg-green-600 text-white",
    };
  }

  async function uploadMainPhoto() {
    if (!mainPhoto) return "";

    const ext = mainPhoto.name.split(".").pop();
    const path = `main/${Date.now()}-${form.equipment_code || "equipo"}.${ext}`;

    const { error } = await supabase.storage
      .from("height-equipment")
      .upload(path, mainPhoto, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
      .from("height-equipment")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function uploadDocument(file: File, folder: string) {
    const cleanFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_");

    const path = `${folder}/${Date.now()}-${cleanFileName}`;

    const { error } = await supabase.storage
      .from("height-equipment")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
      .from("height-equipment")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function loadEquipment() {
    const { data, error } = await supabase
      .from("height_equipment")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setUiError(error.message);
      return;
    }

    setEquipment((data || []) as Equipment[]);
  }

  function startEditEquipment(item: Equipment) {
    const locationValue = item.location || "";
    const isWellServices = locationValue.startsWith("Well Services");

    const unitFromLocation = isWellServices
      ? locationValue.replace("Well Services -", "").trim()
      : "";

    setEditingId(item.id);

    setForm({
      ...emptyForm,
      ...(item as any),
      location: isWellServices ? "Well Services" : locationValue,
      location_other: "",
      well_services_unit:
        item.well_services_unit || unitFromLocation || "",
      certification_validity_months: String(
        item.certification_validity_months || 12
      ),
    });

    setMainPhoto(null);
    setTechnicalSheetFile(null);
    setManufacturerCertFile(null);
    setUiInfo("Editando hoja de vida existente.");
    setUiError("");
    setViewMode("new");
  }

  function requestEditEquipment(item: Equipment) {
    setPendingEditItem(item);
    setEditPassword("");
    setUiError("");
    setUiInfo("Ingresa la contraseña para editar esta hoja de vida.");
  }

  function confirmEditPassword() {
    if (editPassword !== EDIT_PASSWORD) {
      setUiError("Contraseña incorrecta. No se permite editar.");
      return;
    }

    if (pendingEditItem) {
      startEditEquipment(pendingEditItem);
      setPendingEditItem(null);
      setEditPassword("");
    }
  }

  async function saveEquipment() {
    try {
      setSaving(true);
      setUiError("");
      setUiInfo("");

      if (!form.equipment_name.trim()) {
        setUiError("Debes diligenciar el nombre del elemento.");
        return;
      }

      const photoUrl = await uploadMainPhoto();

      let technicalSheetUrl = form.technical_sheet_url;
      let manufacturerCertificationUrl =
        form.manufacturer_certification_url;

      if (technicalSheetFile) {
        technicalSheetUrl = await uploadDocument(
          technicalSheetFile,
          "technical-sheets"
        );
      }

      if (manufacturerCertFile) {
        manufacturerCertificationUrl = await uploadDocument(
          manufacturerCertFile,
          "manufacturer-certifications"
        );
      }

      const { location_other, ...formToSave } = form;

      const payload = {
        ...formToSave,
        location:
          form.location === "Well Services"
            ? `Well Services - ${form.well_services_unit || ""}`
            : form.location === "Otros"
            ? form.location_other
            : form.location,
        well_services_unit:
          form.location === "Well Services"
            ? form.well_services_unit || null
            : null,
        technical_sheet: Boolean(technicalSheetUrl),
        manufacturer_certification: Boolean(manufacturerCertificationUrl),
        technical_sheet_url: technicalSheetUrl,
        manufacturer_certification_url: manufacturerCertificationUrl,
        certification_validity_months: Number(
          form.certification_validity_months || 12
        ),
        main_photo_url: photoUrl || form.main_photo_url,
      };

      let error = null;

      if (editingId) {
        const result = await supabase
          .from("height_equipment")
          .update(payload)
          .eq("id", editingId);

        error = result.error;
      } else {
        const result = await supabase.from("height_equipment").insert(payload);
        error = result.error;
      }

      if (error) {
        setUiError(error.message);
        return;
      }

      setUiInfo(
        editingId
          ? "✅ Hoja de vida actualizada correctamente."
          : "✅ Hoja de vida guardada correctamente."
      );

      setEditingId(null);
      setForm(emptyForm);
      setMainPhoto(null);
      setTechnicalSheetFile(null);
      setManufacturerCertFile(null);
      await loadEquipment();
    } catch (err: any) {
      setUiError(err?.message || "Error guardando equipo.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadEquipment();
  }, []);

function getCertificationFilterValue(expiryDate: string) {
  const cert = getCertificationStatus(expiryDate);

  if (cert.label.includes("VENCIDA")) return "VENCIDA";
  if (cert.label.includes("VENCE")) return "POR_VENCER";
  if (cert.label.includes("VIGENTE")) return "VIGENTE";
  return "SIN_FECHA";
}

const filteredEquipment = equipment.filter((item) => {
  const term = searchTerm.trim().toLowerCase();

  const searchableText = [
    item.equipment_code,
    item.internal_code,
    item.equipment_name,
    item.serial_number,
    item.location,
    item.brand,
    item.category,
    item.well_services_unit,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchesSearch = !term || searchableText.includes(term);

  const matchesLocation =
    !locationFilter ||
    String(item.location || "")
      .toLowerCase()
      .includes(locationFilter.toLowerCase());

  const matchesOperational =
    !operationalStatusFilter || item.status === operationalStatusFilter;

  const matchesCertification =
    !certificationFilter ||
    getCertificationFilterValue(item.certification_expiry_date) ===
      certificationFilter;

  return (
    matchesSearch &&
    matchesLocation &&
    matchesOperational &&
    matchesCertification
  );
});



  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6 bg-white">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <a href="/" className="text-sm text-neutral-600 hover:text-black">
              ← Volver al portal
            </a>

            <h1 className="text-3xl font-bold mt-2">
              Hoja de Vida - Elementos de Protección Contra Caídas
            </h1>

            <p className="text-sm text-neutral-600">
              Formato 02-01-149 F008 · Programa Trabajo en Alturas
            </p>
          </div>

          <img
            src="/logo-eies.png"
            alt="Logo Estrella"
            className="h-20 w-auto"
          />
        </header>

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

        {viewMode === "menu" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setViewMode("new");
              }}
              className="border rounded-2xl p-6 bg-white shadow-sm text-left hover:shadow-md transition"
            >
              <div className="text-2xl font-bold">
                Incluir nuevo elemento
              </div>

              <div className="text-sm text-neutral-600 mt-2">
                Registrar hoja de vida, foto, ficha técnica, certificación y
                fechas de vencimiento.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="border rounded-2xl p-6 bg-white shadow-sm text-left hover:shadow-md transition"
            >
              <div className="text-2xl font-bold">
                Revisar hojas de vida
              </div>

              <div className="text-sm text-neutral-600 mt-2">
                Consultar elementos registrados, documentos, estados y
                vencimientos.
              </div>
            </button>
          </section>
        )}

        {viewMode === "new" && (
          <section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
            <div className="bg-blue-900 text-white text-center font-bold py-2 rounded">
              HOJA DE VIDA ELEMENTOS DE PROTECCIÓN CONTRA CAÍDAS
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setViewMode("menu");
                }}
                className="border rounded px-4 py-2 text-sm bg-white"
              >
                ← Volver al menú
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Lugar / unidad operativa">
                <select
                  className="border p-2 rounded"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                >
                  <option value="">Lugar / unidad operativa</option>
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
                    value={form.well_services_unit || ""}
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
                    onChange={(e) =>
                      updateField("location_other", e.target.value)
                    }
                  />
                )}
              </Field>

              <Field label="Fecha puesta en servicio">
                <input
                  className="border p-2 rounded"
                  type="date"
                  value={form.service_start_date}
                  onChange={(e) =>
                    updateField("service_start_date", e.target.value)
                  }
                />
              </Field>

              <Field label="Código equipo">
                <input
                  className="border p-2 rounded"
                  value={form.equipment_code}
                  onChange={(e) =>
                    updateField("equipment_code", e.target.value)
                  }
                />
              </Field>

              <Field label="Fecha última certificación">
                <input
                  className="border p-2 rounded"
                  type="date"
                  value={form.last_certification_date}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateField("last_certification_date", value);
                    updateField(
                      "certification_expiry_date",
                      calculateExpiryDate(
                        value,
                        form.certification_validity_months
                      )
                    );
                  }}
                />
              </Field>

              <Field label="Vigencia certificación en meses">
                <input
                  className="border p-2 rounded"
                  type="number"
                  value={form.certification_validity_months}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateField("certification_validity_months", value);
                    updateField(
                      "certification_expiry_date",
                      calculateExpiryDate(
                        form.last_certification_date,
                        value
                      )
                    );
                  }}
                />
              </Field>

              <Field label="Fecha de caducidad certificación">
                <input
                  className="border p-2 rounded bg-neutral-50"
                  type="date"
                  value={form.certification_expiry_date}
                  readOnly
                />
              </Field>

              <Field label="Nombre del elemento" className="md:col-span-3">
                <input
                  className="border p-2 rounded"
                  value={form.equipment_name}
                  onChange={(e) =>
                    updateField("equipment_name", e.target.value)
                  }
                />
              </Field>

              <Field label="Categoría">
                <input
                  className="border p-2 rounded"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                />
              </Field>

              <Field label="Marca">
                <input
                  className="border p-2 rounded"
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                />
              </Field>

              <Field label="Modelo No.">
                <input
                  className="border p-2 rounded"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                />
              </Field>

              <Field label="Código interno">
                <input
                  className="border p-2 rounded"
                  value={form.internal_code}
                  onChange={(e) =>
                    updateField("internal_code", e.target.value)
                  }
                />
              </Field>

              <Field label="Tiempo de vida útil">
                <input
                  className="border p-2 rounded"
                  value={form.useful_life}
                  onChange={(e) =>
                    updateField("useful_life", e.target.value)
                  }
                />
              </Field>

              <Field label="Fabricante / MFRD">
                <input
                  className="border p-2 rounded"
                  value={form.manufacturer}
                  onChange={(e) =>
                    updateField("manufacturer", e.target.value)
                  }
                />
              </Field>

              <Field label="Lote">
                <input
                  className="border p-2 rounded"
                  value={form.lot}
                  onChange={(e) => updateField("lot", e.target.value)}
                />
              </Field>

              <Field label="Capacidad">
                <input
                  className="border p-2 rounded"
                  value={form.capacity}
                  onChange={(e) => updateField("capacity", e.target.value)}
                />
              </Field>

              <Field label="Número de serie">
                <input
                  className="border p-2 rounded"
                  value={form.serial_number}
                  onChange={(e) =>
                    updateField("serial_number", e.target.value)
                  }
                />
              </Field>

              <Field label="Cumple estándar" className="md:col-span-3">
                <input
                  className="border p-2 rounded"
                  value={form.standard_compliance}
                  onChange={(e) =>
                    updateField("standard_compliance", e.target.value)
                  }
                />
              </Field>

              <Field label="Descripción del elemento" className="md:col-span-3">
                <textarea
                  className="border p-2 rounded min-h-[100px]"
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                />
              </Field>

              <Field label="Elaborado por">
                <input
                  className="border p-2 rounded"
                  value={form.prepared_by}
                  onChange={(e) =>
                    updateField("prepared_by", e.target.value)
                  }
                />
              </Field>

              <Field label="Área de servicio">
                <input
                  className="border p-2 rounded"
                  value={form.service_area}
                  onChange={(e) =>
                    updateField("service_area", e.target.value)
                  }
                />
              </Field>

              <Field label="Persona a cargo">
                <input
                  className="border p-2 rounded"
                  value={form.person_in_charge}
                  onChange={(e) =>
                    updateField("person_in_charge", e.target.value)
                  }
                />
              </Field>
            </div>

<div className="border rounded p-4 space-y-3">
  <div className="font-semibold">Foto principal del elemento</div>

  <p className="text-xs text-neutral-500">
    Seleccione una imagen desde la galería o tome una fotografía.
  </p>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => setMainPhoto(e.target.files?.[0] || null)}
    className="border p-2 rounded w-full"
  />

  {mainPhoto && (
    <div className="text-sm text-green-700">
      ✅ Imagen seleccionada: {mainPhoto.name}
    </div>
  )}
</div>            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-4 space-y-2">
                <div className="font-semibold">Ficha técnica</div>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setTechnicalSheetFile(e.target.files?.[0] || null)
                  }
                  className="border p-2 rounded w-full"
                />

                {technicalSheetFile && (
                  <div className="text-sm text-green-700">
                    ✅ {technicalSheetFile.name}
                  </div>
                )}
              </div>

              <div className="border rounded p-4 space-y-2">
                <div className="font-semibold">Certificación fabricante</div>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setManufacturerCertFile(e.target.files?.[0] || null)
                  }
                  className="border p-2 rounded w-full"
                />

                {manufacturerCertFile && (
                  <div className="text-sm text-green-700">
                    ✅ {manufacturerCertFile.name}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField("status", "IN_SERVICE")}
                className={`border rounded p-3 font-semibold ${
                  form.status === "IN_SERVICE"
                    ? "bg-green-600 text-white"
                    : "bg-white"
                }`}
              >
                Equipo en servicio
              </button>

              <button
                type="button"
                onClick={() => updateField("status", "OUT_OF_SERVICE")}
                className={`border rounded p-3 font-semibold ${
                  form.status === "OUT_OF_SERVICE"
                    ? "bg-red-600 text-white"
                    : "bg-white"
                }`}
              >
                Equipo fuera de servicio
              </button>
            </div>

            <button
              type="button"
              onClick={saveEquipment}
              disabled={saving}
              className="w-full bg-black text-white py-3 rounded font-semibold disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : editingId
                ? "Actualizar hoja de vida"
                : "Guardar hoja de vida"}
            </button>
          </section>
        )}

        {viewMode === "list" && (
          <section className="space-y-3">
            {pendingEditItem && (
              <div className="border rounded-xl p-4 bg-yellow-50 space-y-3">
                <div className="font-semibold">Confirmar edición</div>

                <input
                  type="password"
                  className="border p-2 rounded w-full"
                  placeholder="Contraseña de edición"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmEditPassword}
                    className="bg-black text-white px-4 py-2 rounded"
                  >
                    Confirmar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingEditItem(null);
                      setEditPassword("");
                    }}
                    className="border px-4 py-2 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-bold">
                Hojas de vida registradas
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
  <div className="font-semibold">Consulta de elementos</div>

  <input
    className="border p-2 rounded w-full"
    placeholder="Buscar por código, serial, nombre, ubicación, marca o unidad..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      value={operationalStatusFilter}
      onChange={(e) => setOperationalStatusFilter(e.target.value)}
    >
      <option value="">Todos los estados</option>
      <option value="IN_SERVICE">En servicio</option>
      <option value="OUT_OF_SERVICE">Fuera de servicio</option>
    </select>

    <select
      className="border p-2 rounded"
      value={certificationFilter}
      onChange={(e) => setCertificationFilter(e.target.value)}
    >
      <option value="">Todas las certificaciones</option>
      <option value="VIGENTE">Certificación vigente</option>
      <option value="POR_VENCER">Próxima a vencer</option>
      <option value="VENCIDA">Vencida</option>
      <option value="SIN_FECHA">Sin fecha</option>
    </select>
  </div>

  <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-neutral-600">
    <div>
      Resultados: <b>{filteredEquipment.length}</b> de{" "}
      <b>{equipment.length}</b>
    </div>

    <button
      type="button"
      onClick={() => {
        setSearchTerm("");
        setLocationFilter("");
        setOperationalStatusFilter("");
        setCertificationFilter("");
      }}
      className="border rounded px-3 py-1"
    >
      Limpiar filtros
    </button>
  </div>
</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredEquipment.map((item) => {
                const certStatus = getCertificationStatus(
                  item.certification_expiry_date
                );

                return (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4 bg-white shadow-sm space-y-3"
                  >
                    {item.main_photo_url ? (
                      <img
                        src={item.main_photo_url}
                        alt={item.equipment_name}
                        className="h-40 w-full object-contain border rounded bg-neutral-50"
                      />
                    ) : (
                      <div className="h-40 border rounded bg-neutral-50 flex items-center justify-center text-sm text-neutral-500">
                        Sin foto
                      </div>
                    )}

                    <div>
                      <div className="font-bold">
                        {item.equipment_name || "Sin nombre"}
                      </div>

                      <div className="text-sm text-neutral-600">
                        {item.category || "Sin categoría"} ·{" "}
                        {item.brand || "Sin marca"}
                      </div>
                    </div>

                    <div className="text-sm">
                      <b>Código:</b>{" "}
                      {item.equipment_code || item.internal_code || "—"}
                    </div>

                    <div className="text-sm">
                      <b>Ubicación:</b> {item.location || "—"}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => requestEditEquipment(item)}
                        className="w-full border rounded p-2 text-sm font-medium hover:bg-neutral-50"
                      >
                        ✏️ Editar hoja de vida
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.technical_sheet_url && (
                        <a
                          href={item.technical_sheet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-800"
                        >
                          Ficha técnica
                        </a>
                      )}

                      {item.manufacturer_certification_url && (
                        <a
                          href={item.manufacturer_certification_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1 rounded bg-purple-100 text-purple-800"
                        >
                          Certificación
                        </a>
                      )}
                    </div>

                    <div className="text-sm">
                      <b>Caducidad:</b>{" "}
                      <span
                        className={
                          certStatus.label.includes("VENCIDA")
                            ? "text-red-600 font-bold"
                            : certStatus.label.includes("VENCE")
                            ? "text-amber-600 font-bold"
                            : certStatus.label.includes("VIGENTE")
                            ? "text-green-700 font-semibold"
                            : "text-neutral-700"
                        }
                      >
                        {item.certification_expiry_date || "—"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === "OUT_OF_SERVICE"
                            ? "bg-red-700 text-white"
                            : "bg-green-700 text-white"
                        }`}
                      >
                        {item.status === "OUT_OF_SERVICE"
                          ? "FUERA DE SERVICIO"
                          : "EN SERVICIO"}
                      </span>

                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${certStatus.className}`}
                      >
                        {certStatus.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}