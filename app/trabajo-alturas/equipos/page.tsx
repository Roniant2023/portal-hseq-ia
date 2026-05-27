"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

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
};

const emptyForm = {
  equipment_code: "",
  location: "",
  location_other: "",
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

export default function HeightEquipmentPage() {
  const [form, setForm] = useState(emptyForm);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [technicalSheetFile, setTechnicalSheetFile] = useState<File | null>(null);
  const [manufacturerCertFile, setManufacturerCertFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uiInfo, setUiInfo] = useState("");
  const [uiError, setUiError] = useState("");

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
    (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
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
      let manufacturerCertificationUrl = form.manufacturer_certification_url;

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
          form.location === "Otros"
            ? form.location_other
            : form.location,
        technical_sheet: Boolean(technicalSheetUrl),
        manufacturer_certification: Boolean(manufacturerCertificationUrl),
        technical_sheet_url: technicalSheetUrl,
        manufacturer_certification_url: manufacturerCertificationUrl,
        certification_validity_months: Number(
          form.certification_validity_months || 12
        ),
        main_photo_url: photoUrl || form.main_photo_url,
      };

      const { error } = await supabase.from("height_equipment").insert(payload);

      if (error) {
        setUiError(error.message);
        return;
      }

      setUiInfo("✅ Hoja de vida guardada correctamente.");
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

        <section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
          <div className="bg-blue-900 text-white text-center font-bold py-2 rounded">
            HOJA DE VIDA ELEMENTOS DE PROTECCIÓN CONTRA CAÍDAS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                Lugar / unidad operativa
              </label>

              <select
                className="border p-2 rounded"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
              >
                <option value="">Lugar / unidad operativa</option>
                <option value="Base Tocancipa">Base Tocancipa</option>
                <option value="Base Palermo">Base Palermo</option>
                <option value="Lote La Florida">Lote La Florida</option>
                <option value="Cementación">Cementación</option>
                <option value="Coiled tubing">Coiled tubing</option>
                <option value="Rig E2027">Rig E2027</option>
                <option value="Otros">Otros</option>
              </select>

              {form.location === "Otros" && (
                <input
                  className="border p-2 rounded"
                  placeholder="Especifique ubicación"
                  value={form.location_other}
                  onChange={(e) =>
                    updateField("location_other", e.target.value)
                  }
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                Fecha puesta en servicio
              </label>

              <input
                className="border p-2 rounded"
                type="date"
                value={form.service_start_date}
                onChange={(e) =>
                  updateField("service_start_date", e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                Código equipo
              </label>

              <input
                className="border p-2 rounded"
                placeholder="Código equipo"
                value={form.equipment_code}
                onChange={(e) => updateField("equipment_code", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                Fecha última certificación
              </label>

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
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                Vigencia certificación en meses
              </label>

              <input
                className="border p-2 rounded"
                type="number"
                value={form.certification_validity_months}
                onChange={(e) => {
                  const value = e.target.value;
                  updateField("certification_validity_months", value);
                  updateField(
                    "certification_expiry_date",
                    calculateExpiryDate(form.last_certification_date, value)
                  );
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                Fecha de caducidad certificación
              </label>

              <input
                className="border p-2 rounded bg-neutral-50"
                type="date"
                value={form.certification_expiry_date}
                readOnly
              />
            </div>

            <input
              className="border p-2 rounded md:col-span-3"
              placeholder="Nombre del elemento"
              value={form.equipment_name}
              onChange={(e) => updateField("equipment_name", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Categoría"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Marca"
              value={form.brand}
              onChange={(e) => updateField("brand", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Modelo No."
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Código interno"
              value={form.internal_code}
              onChange={(e) => updateField("internal_code", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Tiempo de vida útil"
              value={form.useful_life}
              onChange={(e) => updateField("useful_life", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Fabricante / MFRD"
              value={form.manufacturer}
              onChange={(e) => updateField("manufacturer", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Lote"
              value={form.lot}
              onChange={(e) => updateField("lot", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Capacidad"
              value={form.capacity}
              onChange={(e) => updateField("capacity", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Número de serie"
              value={form.serial_number}
              onChange={(e) => updateField("serial_number", e.target.value)}
            />

            <input
              className="border p-2 rounded md:col-span-3"
              placeholder="Cumple estándar"
              value={form.standard_compliance}
              onChange={(e) =>
                updateField("standard_compliance", e.target.value)
              }
            />

            <textarea
              className="border p-2 rounded md:col-span-3 min-h-[100px]"
              placeholder="Descripción del elemento"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Elaborado por"
              value={form.prepared_by}
              onChange={(e) => updateField("prepared_by", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Área de servicio"
              value={form.service_area}
              onChange={(e) => updateField("service_area", e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Persona a cargo"
              value={form.person_in_charge}
              onChange={(e) =>
                updateField("person_in_charge", e.target.value)
              }
            />
          </div>

          <div className="border rounded p-4 space-y-3">
            <div className="font-semibold">Foto principal del elemento</div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setMainPhoto(e.target.files?.[0] || null)}
              className="border p-2 rounded w-full"
            />

            {mainPhoto && (
              <div className="text-sm text-green-700">
                ✅ {mainPhoto.name}
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
            {saving ? "Guardando..." : "Guardar hoja de vida"}
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Equipos registrados</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {equipment.map((item) => {
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

  {/* Estado operativo */}
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

  {/* Estado certificación */}
  <span
    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
      certStatus.className
    }`}
  >
    {certStatus.label}
  </span>

</div>

                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}