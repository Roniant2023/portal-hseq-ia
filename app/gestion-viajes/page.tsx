"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "jspdf-autotable";
type Option = {
  label: string;
  score: number;
};

const distanceOptions: Option[] = [
  { label: "< 50 Km", score: 1 },
  { label: "50 a 100 Km", score: 2 },
  { label: "100 a 300 Km", score: 3 },
  { label: "> 300 Km", score: 8 },
];

const weatherOptions: Option[] = [
  { label: "Soleado / Nublado", score: 1 },
  { label: "Lluvia / Barro / Viento", score: 2 },
  { label: "Tormentas tropicales", score: 4 },
  { label: "Nieve / Heladas", score: 6 },
];

const routeOptions: Option[] = [
  { label: "Pavimento", score: 1 },
  { label: "Mixta (50% pavimento)", score: 2 },
  { label: "No pavimentada", score: 5 },
  { label: "Cornisa / Precipicio", score: 8 },
];

const routeKnowledgeOptions: Option[] = [
  { label: "Conoce la ruta", score: 1 },
  { label: "Recorrida al menos 1 vez", score: 2 },
  { label: "No la conoce", score: 5 },
];

const communicationOptions: Option[] = [
  { label: "Celular / Radio", score: 1 },
  { label: "Parte del camino", score: 2 },
  { label: "Sin comunicación en convoy", score: 5 },
  { label: "Sin comunicación solo", score: 8 },
];

const peopleOptions: Option[] = [
  { label: "2 o + vehículos con 2 o + personas", score: 1 },
  { label: "2 o + vehículos con 1 persona por vehículo", score: 2 },
  { label: "1 vehículo con 2 o + personas", score: 4 },
  { label: "1 vehículo con 1 persona", score: 6 },
];

const hoursOptions: Option[] = [
  { label: "< 8 Hrs", score: 2 },
  { label: "8 - 12 Hrs", score: 4 },
  { label: "12 - 16 Hrs", score: 5 },
  { label: "> 16 Hrs - Viaje no autorizado", score: 999 },
];

function scoreOf(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getRiskResult(total: number, hoursScore: number) {
  if (hoursScore >= 999) {
    return {
      level: "VIAJE NO AUTORIZADO",
      color: "bg-red-600 text-white",
      authorization:
        "No se autoriza el viaje por superar 16 horas trabajadas + tiempo de viaje.",
      requiresAuthorization: false,
      authorizationType: "not_authorized",
    };
  }

  if (total <= 20) {
    return {
      level: "BAJO",
      color: "bg-green-600 text-white",
      authorization: "No requiere autorización.",
      requiresAuthorization: false,
      authorizationType: "none",
    };
  }

  if (total <= 30) {
    return {
      level: "BAJO - MEDIO",
      color: "bg-amber-400 text-black",
      authorization: "Requiere autorización del Supervisor Inmediato.",
      requiresAuthorization: true,
      authorizationType: "supervisor",
    };
  }

  if (total <= 40) {
    return {
      level: "MEDIO - ALTO",
      color: "bg-orange-500 text-black",
      authorization:
        "Debe seleccionar autorizador: Superintendente / Jefe de Sector, Base o Región.",
      requiresAuthorization: true,
      authorizationType: "menu_31_40",
    };
  }

  return {
    level: "ALTO",
    color: "bg-red-600 text-white",
    authorization:
      "Debe seleccionar autorizador: Gerente de Operaciones, Distrito o País.",
    requiresAuthorization: true,
    authorizationType: "menu_over_40",
  };
}

export default function GestionViajesPage() {
  const logoSrc = "/logo-eies.png";
  const driverCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const [savingTravel, setSavingTravel] = useState(false);
  const [savedTravelCode, setSavedTravelCode] = useState("");
  const [savedTravelId, setSavedTravelId] = useState("");
  const [approvalLink, setApprovalLink] = useState("");
  const [creatingApproval, setCreatingApproval] = useState(false);
  const [approverSignature, setApproverSignature] = useState("");
  const [driverSignature, setDriverSignature] = useState("");
  const [driverDrawing, setDriverDrawing] = useState(false);

  const [uiError, setUiError] = useState<string | null>(null);
  const [uiInfo, setUiInfo] = useState<string | null>(null);

  const [vehicle, setVehicle] = useState({
    vehicle: "",
    brand: "",
    type: "",
    plate: "",
  });

  const [driver, setDriver] = useState({
    name: "",
    company: "",
    phone: "",
  });

 const [trip, setTrip] = useState({
  reason: "",
  departureDateTime: "",
  origin: "",
  originLat: "",
  originLon: "",
  destination: "",
  destinationLat: "",
  destinationLon: "",
  arrivalDateTime: "",
  cargoType: "",
  kilometers: "",
  estimatedDurationMinutes: "",
  authorizedRoute: "",
});

  const [documents, setDocuments] = useState<Record<string, boolean>>({
    propertyCard: false,
    insurance: false,
    technicalReview: false,
    specialPermits: false,
    fieldEntryAuthorization: false,
    drivingLicense: false,
    defensiveDriving: false,
    fourByFourCourse: false,
  });

  const [inspection, setInspection] = useState<Record<string, boolean>>({
    seatbelt: false,
    triangles: false,
    tachograph: false,
    jackTools: false,
    extinguisher: false,
    reverseAlarm: false,
    spareWheel: false,
    firstAidKit: false,
  });

  const [inspector, setInspector] = useState({
    name: "",
    position: "",
  });

  const [risk, setRisk] = useState({
    distance: "",
    weather: "",
    route: "",
    routeKnowledge: "",
    communication: "",
    people: "",
    hours: "",
    nightTravel: false,
  });

  const [approver, setApprover] = useState({
    name: "",
    role: "",
    phone: "",
  });

  const totalRisk = useMemo(() => {
    const base =
      scoreOf(risk.distance) +
      scoreOf(risk.weather) +
      scoreOf(risk.route) +
      scoreOf(risk.routeKnowledge) +
      scoreOf(risk.communication) +
      scoreOf(risk.people) +
      scoreOf(risk.hours);

    return base + (risk.nightTravel ? 3 : 0);
  }, [risk]);

  const result = getRiskResult(totalRisk, scoreOf(risk.hours));
  const criticalInspectionOk = Object.values(inspection).every(Boolean);

  const criticalDocumentsOk =
    documents.propertyCard &&
    documents.insurance &&
    documents.technicalReview &&
    documents.drivingLicense &&
    documents.defensiveDriving;

  const canSaveTravel = criticalDocumentsOk && criticalInspectionOk;

  const requiredFieldsOk =
    vehicle.brand.trim() &&
    vehicle.type.trim() &&
    vehicle.plate.trim() &&
    driver.name.trim() &&
    driver.company.trim() &&
    driver.phone.trim() &&
    trip.reason.trim() &&
    trip.departureDateTime.trim() &&
    trip.origin.trim() &&
    trip.destination.trim() &&
    trip.arrivalDateTime.trim() &&
    trip.cargoType.trim() &&
    trip.kilometers.trim() &&
    trip.authorizedRoute.trim() &&
    inspector.name.trim() &&
    inspector.position.trim() &&
    risk.distance &&
    risk.weather &&
    risk.route &&
    risk.routeKnowledge &&
    risk.communication &&
    risk.people &&
    risk.hours &&
    driverSignature;

  const canSubmitTravel = canSaveTravel && Boolean(requiredFieldsOk);

  function updateVehicle(key: string, value: string) {
    setVehicle((prev) => ({ ...prev, [key]: value }));
  }

  function updateDriver(key: string, value: string) {
    setDriver((prev) => ({ ...prev, [key]: value }));
  }

  function updateTrip(key: string, value: string) {
    setTrip((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDocument(key: string) {
    setDocuments((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleInspection(key: string) {
    setInspection((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updateRisk(key: string, value: string | boolean) {
    setRisk((prev) => ({ ...prev, [key]: value }));
  }
async function handleCalculateRoute() {
  try {
    setUiError(null);
    setUiInfo(null);

    if (!trip.origin.trim() || !trip.destination.trim()) {
      setUiError("Debes diligenciar origen y destino para calcular la ruta.");
      return;
    }

    const res = await fetch("/api/calculate-route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin: trip.origin,
        destination: trip.destination,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      setUiError(data?.error || "No se pudo calcular la ruta.");
      return;
    }

   setTrip((prev) => {
  let calculatedArrival = prev.arrivalDateTime;

  const drivingMinutes = Number(data.duration_minutes);

let totalTravelMinutes = drivingMinutes;

// Descanso de 20 min cada 2 horas
const restBlocks = Math.floor(drivingMinutes / 120);
const restMinutes = restBlocks * 20;

totalTravelMinutes += restMinutes;

// Turnos de 12 horas
// Máximo 8 horas manejando por turno
const drivingShifts = Math.floor(drivingMinutes / 480);

// Descanso obligatorio entre turnos: 8 horas
const mandatoryRestMinutes = drivingShifts * 480;

totalTravelMinutes += mandatoryRestMinutes;

  if (prev.departureDateTime) {
    const departure = new Date(prev.departureDateTime);

    const arrival = new Date(departure);

    // Sumar conducción + descansos
    arrival.setMinutes(
      arrival.getMinutes() + totalTravelMinutes
    );

    // Validar cruce de almuerzo (12:00 m)
    const lunchTime = new Date(departure);

    lunchTime.setHours(12, 0, 0, 0);

    if (
      departure <= lunchTime &&
      arrival >= lunchTime
    ) {
      arrival.setMinutes(arrival.getMinutes() + 60);

      totalTravelMinutes += 60;
    }

    calculatedArrival = arrival
      .toISOString()
      .slice(0, 16);
  }

  return {
    ...prev,
    originLat: String(data.origin_coords.lat),
    originLon: String(data.origin_coords.lon),
    destinationLat: String(data.destination_coords.lat),
    destinationLon: String(data.destination_coords.lon),
    kilometers: String(data.distance_km),
    estimatedDurationMinutes: String(totalTravelMinutes),
    arrivalDateTime: calculatedArrival,
  };
});


    setUiInfo(
      `✅ Ruta calculada: ${data.distance_km} km · ${data.duration_minutes} min aprox.`
    );
  } catch (err: any) {
    setUiError(err?.message || "Error calculando la ruta.");
  }
}

  function getDriverPos(e: any) {
    const canvas = driverCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];

    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDriverDraw(e: any) {
    e.preventDefault();

    const canvas = driverCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getDriverPos(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x, pos.y);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.stroke();

    setDriverDrawing(true);
  }

  function drawDriver(e: any) {
    if (!driverDrawing) return;

    e.preventDefault();

    const ctx = driverCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const pos = getDriverPos(e);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDriverDraw() {
    setDriverDrawing(false);

    const data = driverCanvasRef.current?.toDataURL("image/png") || "";
    setDriverSignature(data);
  }

  function clearDriverSignature() {
    const canvas = driverCanvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDriverSignature("");
  }

  async function handleSaveTravel() {
    try {
      setSavingTravel(true);
      setUiError(null);
      setUiInfo(null);

      if (!canSubmitTravel) {
        setUiError(
          "No se puede guardar la gestión de viaje. Faltan datos obligatorios, documentos críticos, firma del conductor o la inspección abreviada está NO APTA."
        );
        return;
      }

      const payload = {
        vehicle,
        driver,
        documents,
        trip,
        inspection,
        inspector,
        driverSignature,
        risk: {
          ...risk,
          total: totalRisk,
          level: result.level,
          authorization: result.authorization,
          inspectionStatus: criticalInspectionOk ? "APTO" : "NO APTO",
        },
        authorization: {
          status: result.level,
          requiredAuthorization: result.authorization,
        },
      };

      const res = await fetch("/api/save-travel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setUiError(data?.error || "No se pudo guardar la gestión de viaje.");
        return;
      }

      setSavedTravelCode(data.travel_code || "");
      setSavedTravelId(data?.data?.id || "");
      setUiInfo("✅ Gestión de viaje guardada correctamente.");
    } catch (err: any) {
      setUiError(err?.message || "Error guardando la gestión de viaje.");
    } finally {
      setSavingTravel(false);
    }
  }

  async function handleCreateApprovalLink() {
    try {
      setCreatingApproval(true);
      setUiError(null);
      setUiInfo(null);

      if (!savedTravelId) {
        setUiError("Primero debes guardar la gestión de viaje.");
        return;
      }

      if (!approver.name.trim() || !approver.phone.trim()) {
        setUiError("Debes seleccionar o ingresar nombre y celular del aprobador.");
        return;
      }

      if (result.authorizationType !== "supervisor" && !approver.role.trim()) {
        setUiError("Debes seleccionar el cargo autorizador.");
        return;
      }

      const roleToSend =
        result.authorizationType === "supervisor"
          ? "Supervisor Inmediato"
          : approver.role;

      const res = await fetch("/api/create-travel-approval-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          travel_id: savedTravelId,
          approver_name: approver.name,
          approver_role: roleToSend,
          approver_phone: approver.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setUiError(data?.error || "No se pudo generar el link.");
        return;
      }

      setApprovalLink(data.approval_url);

      const cleanPhone = approver.phone.replace(/\D/g, "");
      const message = `Hola ${approver.name}, por favor aprueba la gestión de viaje desde el siguiente enlace:\n\n${data.approval_url}`;

      window.open(
        `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );

      setUiInfo("✅ Link de aprobación generado.");
    } catch (err: any) {
      setUiError(err?.message || "Error generando link.");
    } finally {
      setCreatingApproval(false);
    }
  }

  async function refreshApprovalSignature() {
    try {
      if (!savedTravelId) return;

      const res = await fetch("/api/get-travel-approval-by-travel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          travel_id: savedTravelId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) return;

      setApproverSignature(data.approval?.signature_data || "");
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!savedTravelId) return;

    refreshApprovalSignature();

    const interval = window.setInterval(() => {
      refreshApprovalSignature();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [savedTravelId]);

  async function handleGeneratePdf() {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, {
  scale: 2,
  useCORS: true,
  backgroundColor: "#ffffff",
  logging: false,
  allowTaint: true,
  foreignObjectRendering: false,

  onclone: (clonedDoc) => {
    clonedDoc.querySelectorAll("*").forEach((el: any) => {
      el.style.color = "#171717";
      el.style.backgroundColor = "#ffffff";
      el.style.borderColor = "#d4d4d4";
      el.style.boxShadow = "none";
    });
  },
});

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`gestion-viaje-${savedTravelCode || "sin-codigo"}.pdf`);
  }

  return (
    <div ref={pdfRef} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Gestión Digital de Viajes</h1>
          <p className="text-sm text-neutral-600">
            Hoja de Gestión de Viajes · Formato 02-01-125-F002
          </p>
        </div>

        <img src={logoSrc} alt="Logo Estrella" className="h-20 w-auto object-contain" />
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

      {savedTravelCode && (
        <div className="text-sm font-semibold text-green-700">
          Código gestión de viaje: {savedTravelCode}
        </div>
      )}

      <section className="border rounded-xl p-4 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <b>Título del Sistema:</b> Gestión de HSSEQ
          </div>
          <div>
            <b>Nombre del Formato:</b> Hoja de Gestión de Viajes
          </div>
          <div>
            <b>N° del Formato:</b> 02-01-125-F002
          </div>
          <div>
            <b>Fecha Emisión:</b> 22 Julio 2025
          </div>
          <div>
            <b>Revisión:</b> 09
          </div>
          <div>
            <b>Aprobado por:</b> RAS
          </div>
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <h2 className="text-lg font-semibold">Datos del vehículo</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Marca"
            value={vehicle.brand}
            onChange={(e) => updateVehicle("brand", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Tipo"
            value={vehicle.type}
            onChange={(e) => updateVehicle("type", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Placa / Interno / Patente"
            value={vehicle.plate}
            onChange={(e) => updateVehicle("plate", e.target.value)}
          />
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <h2 className="text-lg font-semibold">Datos del conductor</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Nombre del conductor"
            value={driver.name}
            onChange={(e) => updateDriver("name", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Empresa"
            value={driver.company}
            onChange={(e) => updateDriver("company", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Teléfono / WhatsApp"
            value={driver.phone}
            onChange={(e) => updateDriver("phone", e.target.value)}
          />
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Documentos</h2>
            <p className="text-sm text-neutral-600">
              Los documentos críticos deben estar disponibles y vigentes.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              criticalDocumentsOk ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {criticalDocumentsOk ? "APTO" : "NO APTO"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          {[
            ["propertyCard", "Tarjeta de propiedad"],
            ["insurance", "Póliza de seguro"],
            ["technicalReview", "Revisión técnica"],
            ["specialPermits", "Permisos especiales"],
            ["fieldEntryAuthorization", "Autorización ingreso a yacimientos"],
            ["drivingLicense", "Licencia de conducir"],
            ["defensiveDriving", "Manejo defensivo"],
            ["fourByFourCourse", "Curso 4x4"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 border rounded p-2">
              <input
                type="checkbox"
                checked={documents[key]}
                onChange={() => toggleDocument(key)}
              />
              {label}
            </label>
          ))}
        </div>
      </section>
<section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
  <h2 className="text-lg font-semibold">Datos del viaje</h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[
      ["Motivo del viaje", trip.reason, "reason", false],
      ["Fecha y hora de inicio", trip.departureDateTime, "departureDateTime", true],
      ["Origen", trip.origin, "origin", false],
      ["Destino", trip.destination, "destination", false],
      ["Fecha y hora estimada de llegada", trip.arrivalDateTime, "arrivalDateTime", true],
      ["Tipo de carga que transporta", trip.cargoType, "cargoType", false],
    ].map(([label, value, key, isDate]: any) => (
      <div key={key} className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-600">{label}</label>
        <input
          className="h-12 border p-3 rounded-lg"
          type={isDate ? "datetime-local" : "text"}
          value={value}
          onChange={(e) => updateTrip(key, e.target.value)}
        />
      </div>
    ))}

    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-600">
        Kilómetros a recorrer
      </label>
      <input
        className="h-12 border p-3 rounded-lg bg-neutral-50"
        value={trip.kilometers}
        readOnly
      />
    </div>

    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-600">
        Tiempo estimado total en ruta
      </label>
      <input
        className="h-12 border p-3 rounded-lg bg-neutral-50"
        value={
          trip.estimatedDurationMinutes
            ? `${(Number(trip.estimatedDurationMinutes) / 60).toFixed(1)} horas`
            : ""
        }
        readOnly
      />
    </div>

    <div className="flex flex-col gap-1 md:col-span-3">
      <label className="text-xs font-medium text-neutral-600">
        Ruta / camino autorizado
      </label>
      <input
        className="h-12 border p-3 rounded-lg"
        value={trip.authorizedRoute}
        onChange={(e) => updateTrip("authorizedRoute", e.target.value)}
      />
    </div>
  </div>

  <button
    type="button"
    onClick={handleCalculateRoute}
    className="mt-4 h-11 px-5 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition"
  >
    Calcular ruta automáticamente
  </button>
</section>
          <section className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Inspección abreviada pre-viaje</h2>
            <p className="text-sm text-neutral-600">
              No se podrá iniciar el viaje si un elemento crítico no está disponible o está en mal estado.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              criticalInspectionOk ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {criticalInspectionOk ? "APTO" : "NO APTO"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          {[
            ["seatbelt", "Cinturón de seguridad"],
            ["triangles", "Triángulos (2)"],
            ["tachograph", "Tacógrafo"],
            ["jackTools", "Gato y llaves"],
            ["extinguisher", "Extintor de incendios"],
            ["reverseAlarm", "Alarma de retroceso"],
            ["spareWheel", "Rueda de auxilio"],
            ["firstAidKit", "Botiquín"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 border rounded p-2">
              <input
                type="checkbox"
                checked={inspection[key]}
                onChange={() => toggleInspection(key)}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Inspeccionado por"
            value={inspector.name}
            onChange={(e) => setInspector((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="border p-2 rounded"
            placeholder="Puesto del inspector"
            value={inspector.position}
            onChange={(e) => setInspector((p) => ({ ...p, position: e.target.value }))}
          />
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold">Evaluación automática de riesgos</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <RiskSelect title="1. Distancia a recorrer" value={risk.distance} options={distanceOptions} onChange={(v) => updateRisk("distance", v)} />
          <RiskSelect title="2. Clima" value={risk.weather} options={weatherOptions} onChange={(v) => updateRisk("weather", v)} />
          <RiskSelect title="3. Ruta" value={risk.route} options={routeOptions} onChange={(v) => updateRisk("route", v)} />
          <RiskSelect title="4. Conocimiento de ruta" value={risk.routeKnowledge} options={routeKnowledgeOptions} onChange={(v) => updateRisk("routeKnowledge", v)} />
          <RiskSelect title="5. Comunicación disponible" value={risk.communication} options={communicationOptions} onChange={(v) => updateRisk("communication", v)} />
          <RiskSelect title="6. Personas por vehículo" value={risk.people} options={peopleOptions} onChange={(v) => updateRisk("people", v)} />
          <RiskSelect title="7. Horas trabajadas + tiempo viaje" value={risk.hours} options={hoursOptions} onChange={(v) => updateRisk("hours", v)} />
        </div>

        <label className="flex items-center gap-2 border rounded p-3 text-sm bg-neutral-50">
          <input
            type="checkbox"
            checked={risk.nightTravel}
            onChange={() => updateRisk("nightTravel", !risk.nightTravel)}
          />
          Viaje nocturno: suma 3 puntos
        </label>

        <div className="border rounded-xl p-4 bg-neutral-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-sm text-neutral-600">Total evaluación</div>
            <div className="text-3xl font-bold">
              {totalRisk >= 999 ? "No autorizado" : totalRisk}
            </div>
          </div>

          <div className="space-y-2">
            <span className={`inline-flex px-4 py-2 rounded-full font-semibold ${result.color}`}>
              {result.level}
            </span>
            <div className="text-sm text-neutral-800">{result.authorization}</div>
          </div>
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Firma del conductor</h2>
          <p className="text-sm text-neutral-600">
            El conductor debe registrar su firma antes de solicitar aprobación.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border p-2 rounded bg-neutral-50" value={driver.name} readOnly />
          <input className="border p-2 rounded bg-neutral-50" value={driver.company} readOnly />
        </div>

        <canvas
          ref={driverCanvasRef}
          className="w-full border rounded bg-white touch-none"
          width={900}
          height={220}
          onMouseDown={startDriverDraw}
          onMouseMove={drawDriver}
          onMouseUp={endDriverDraw}
          onMouseLeave={endDriverDraw}
          onTouchStart={startDriverDraw}
          onTouchMove={drawDriver}
          onTouchEnd={endDriverDraw}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearDriverSignature}
            className="px-4 py-2 border rounded"
          >
            Limpiar firma
          </button>
        </div>

        {driverSignature && (
          <div className="border rounded bg-green-50 border-green-200 p-3 text-sm text-green-800">
            ✅ Firma del conductor registrada.
          </div>
        )}
      </section>

      {savedTravelId && result.requiresAuthorization && (
        <section className="border rounded-xl p-4 space-y-4 bg-blue-50 border-blue-200">
          <div className="font-semibold">Aprobación remota</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {result.authorizationType === "menu_31_40" ? (
              <select
                className="border p-2 rounded"
                value={approver.name}
                onChange={(e) => {
                  const selected = e.target.value;

                  if (selected === "Maria Ardila") {
                    setApprover({
                      name: "Maria Ardila",
                      role: "Coordinadora operaciones",
                      phone: "3102400354",
                    });
                    return;
                  }

                  if (selected === "Mauricio Rodriguez") {
                    setApprover({
                      name: "Mauricio Rodriguez",
                      role: "Coordinador de operaciones",
                      phone: "3164903050",
                    });
                    return;
                  }

                  setApprover({
                    name: "",
                    role: "",
                    phone: "",
                  });
                }}
              >
                <option value="">Seleccione aprobador</option>
                <option value="Maria Ardila">Maria Ardila</option>
                <option value="Mauricio Rodriguez">Mauricio Rodriguez</option>
              </select>
            ) : result.authorizationType === "menu_over_40" ? (
              <select
                className="border p-2 rounded"
                value={approver.name}
                onChange={(e) => {
                  const selected = e.target.value;

                  if (selected === "Andres Villa") {
                    setApprover({
                      name: "Andres Villa",
                      role: "Gerente de Well Services",
                      phone: "3202753777",
                    });
                    return;
                  }

                  if (selected === "Rito Salamanca") {
                    setApprover({
                      name: "Rito Salamanca",
                      role: "Gerente País",
                      phone: "3153518501",
                    });
                    return;
                  }

                  setApprover({
                    name: "",
                    role: "",
                    phone: "",
                  });
                }}
              >
                <option value="">Seleccione aprobador</option>
                <option value="Andres Villa">Andres Villa</option>
                <option value="Rito Salamanca">Rito Salamanca</option>
              </select>
            ) : (
              <input
                className="border p-2 rounded"
                placeholder="Nombre aprobador"
                value={approver.name}
                onChange={(e) =>
                  setApprover((p) => ({
                    ...p,
                    name: e.target.value,
                  }))
                }
              />
            )}

            {result.authorizationType === "supervisor" ? (
              <input
                className="border p-2 rounded bg-neutral-50"
                value="Supervisor Inmediato"
                readOnly
              />
            ) : (
              <input
                className="border p-2 rounded bg-neutral-50"
                placeholder="Cargo"
                value={approver.role}
                readOnly
              />
            )}

            <input
              className="border p-2 rounded bg-neutral-50"
              placeholder="Celular"
              value={approver.phone}
              readOnly={
                result.authorizationType === "menu_31_40" ||
                result.authorizationType === "menu_over_40"
              }
              onChange={(e) =>
                setApprover((p) => ({
                  ...p,
                  phone: e.target.value,
                }))
              }
            />
          </div>

          <button
            type="button"
            onClick={handleCreateApprovalLink}
            disabled={creatingApproval}
            className="px-4 py-2 bg-green-700 text-white rounded disabled:opacity-50"
          >
            {creatingApproval ? "Generando..." : "Enviar aprobación por WhatsApp"}
          </button>

          {approvalLink && (
            <div className="border rounded bg-white p-3 break-all text-sm">
              {approvalLink}
            </div>
          )}

          {approverSignature && (
            <div className="border rounded bg-white p-3">
              <div className="text-sm font-medium mb-2">
                Firma del aprobador registrada
              </div>

              <img
                src={approverSignature}
                alt="Firma aprobador"
                className="max-h-[100px] w-auto object-contain border rounded bg-white"
              />
            </div>
          )}
        </section>
      )}

      {!canSubmitTravel && (
        <section className="border rounded-xl p-4 bg-red-50 border-red-200 text-red-800 text-sm">
          <div className="font-semibold">Gestión de viaje NO APTA para guardar</div>
          <div className="mt-1">
            Verifica que estén marcados los documentos críticos, que no haya
            campos obligatorios vacíos, que la inspección abreviada esté apta y
            que el conductor haya firmado.
          </div>
        </section>
      )}

      <div className="flex justify-end gap-3 flex-wrap">
        {approverSignature && (
          <button
            type="button"
            onClick={handleGeneratePdf}
            className="px-5 py-2 bg-blue-700 text-white rounded"
          >
            Generar PDF
          </button>
        )}

        <button type="button" className="px-5 py-2 border rounded">
          Guardar borrador
        </button>

        <button
          type="button"
          onClick={handleSaveTravel}
          disabled={savingTravel || !canSubmitTravel}
          className="px-5 py-2 bg-black text-white rounded disabled:opacity-50"
        >
          {savingTravel
            ? "Guardando..."
            : !canSubmitTravel
            ? "No apto para guardar"
            : "Guardar gestión de viaje"}
        </button>
      </div>
    </div>
  );
}

function RiskSelect({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) 
{
  return (
    <div className="border rounded p-3">
      <label className="text-sm font-semibold">{title}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-2 rounded w-full mt-2"
      >
        <option value="">Seleccione</option>
        {options.map((op) => (
          <option key={`${op.label}-${op.score}`} value={op.score}>
            {op.label} — {op.score}
          </option>
        ))}
      </select>
    </div>
  );
}