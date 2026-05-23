"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const documentLabels: Record<string, string> = {
  propertyCard: "Tarjeta de propiedad",
  insurance: "Póliza de seguro",
  technicalReview: "Revisión técnica",
  specialPermits: "Permisos especiales",
  fieldEntryAuthorization: "Autorización ingreso a yacimientos",
  drivingLicense: "Licencia de conducir",
  defensiveDriving: "Manejo defensivo",
  fourByFourCourse: "Curso 4x4",
};

const inspectionLabels: Record<string, string> = {
  seatbelt: "Cinturón de seguridad",
  triangles: "Triángulos (2)",
  tachograph: "Tacógrafo",
  jackTools: "Gato y llaves",
  extinguisher: "Extintor de incendios",
  reverseAlarm: "Alarma de retroceso",
  spareWheel: "Rueda de auxilio",
  firstAidKit: "Botiquín",
};

function BoolText({ value }: { value: boolean }) {
  return (
    <span className={value ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
      {value ? "Sí" : "No"}
    </span>
  );
}

export default function TravelApprovalPage() {
  const params = useParams();
  const token = String(params?.token || "");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState("");
  const [saving, setSaving] = useState(false);

  const [uiInfo, setUiInfo] = useState("");
  const [uiError, setUiError] = useState("");

  const [travel, setTravel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function getPos(e: any) {
    const canvas = canvasRef.current!;
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

  function startDraw(e: any) {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.stroke();

    setDrawing(true);
  }

  function draw(e: any) {
    if (!drawing) return;
    e.preventDefault();

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    setDrawing(false);
    setSignature(canvasRef.current?.toDataURL("image/png") || "");
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  }

  async function handleGeneratePdf() {
    try {
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

      pdf.save(`gestion-viaje-${travel?.travel_code || "aprobada"}.pdf`);
    } catch (err) {
      console.error(err);
      setUiError("No se pudo generar el PDF.");
    }
  }

  async function handleApprove() {
    try {
      setSaving(true);
      setUiError("");
      setUiInfo("");

      if (!signature) {
        setUiError("Debes registrar la firma antes de aprobar.");
        return;
      }

      const res = await fetch("/api/sign-travel-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          signature_data: signature,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setUiError(data?.error || "No se pudo guardar la aprobación.");
        return;
      }

      setTravel((prev: any) => ({
        ...prev,
        approval_json: {
          ...(prev?.approval_json || {}),
          status: "approved",
          signature_data: signature,
          signed_at: new Date().toISOString(),
        },
      }));

      setUiInfo("✅ Viaje aprobado correctamente.");
    } catch (err: any) {
      setUiError(err?.message || "Error aprobando viaje.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 220;
  }, []);

  useEffect(() => {
    async function loadTravel() {
      try {
        const res = await fetch("/api/get-travel-approval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          setUiError(data?.error || "No se pudo cargar la gestión de viaje.");
          return;
        }

        setTravel(data.travel);

        if (data.travel?.approval_json?.signature_data) {
          setSignature(data.travel.approval_json.signature_data);
          setUiInfo("✅ Viaje aprobado correctamente.");
        }
      } catch (err: any) {
        setUiError(err?.message || "Error cargando gestión de viaje.");
      } finally {
        setLoading(false);
      }
    }

    loadTravel();
  }, [token]);

  const vehicle = travel?.vehicle_json || {};
  const driver = travel?.driver_json || {};
  const trip = travel?.trip_json || {};
  const documents = travel?.documents_json || {};
  const inspection = travel?.inspection_json || {};
  const inspector = travel?.inspector_json || {};
  const risk = travel?.risk_json || {};
  const approval = travel?.approval_json || {};

  const approverSignature = approval?.signature_data || signature;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-5">
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

      {loading && (
        <div className="text-sm text-neutral-600">
          Cargando gestión de viaje...
        </div>
      )}

      <div ref={pdfRef} className="space-y-5 bg-white">
        <div className="border rounded-xl p-4 bg-white">
          <h1 className="text-2xl font-semibold">Gestión Digital de Viajes</h1>
          <p className="text-sm text-neutral-600">
            Hoja de Gestión de Viajes · Formato 02-01-125-F002
          </p>
        </div>

        {travel && (
          <>
            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Información general</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><b>Código:</b> {travel.travel_code || "—"}</div>
                <div><b>Título del Sistema:</b> Gestión de HSSEQ</div>
                <div><b>Formato:</b> 02-01-125-F002</div>
                <div><b>Fecha emisión:</b> 22 Julio 2025</div>
                <div><b>Revisión:</b> 09</div>
                <div><b>Aprobado por:</b> RAS</div>
              </div>
            </section>

            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Datos del vehículo</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><b>Marca:</b> {vehicle.brand || "—"}</div>
                <div><b>Tipo:</b> {vehicle.type || "—"}</div>
                <div><b>Placa / Interno / Patente:</b> {vehicle.plate || "—"}</div>
              </div>
            </section>

            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Datos del conductor</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><b>Nombre:</b> {driver.name || "—"}</div>
                <div><b>Empresa:</b> {driver.company || "—"}</div>
                <div><b>Teléfono:</b> {driver.phone || "—"}</div>
              </div>
            </section>

            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Documentos</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {Object.entries(documentLabels).map(([key, label]) => (
                  <div key={key} className="border rounded p-2">
                    <b>{label}:</b> <BoolText value={Boolean(documents[key])} />
                  </div>
                ))}
              </div>
            </section>

            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Datos del viaje</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><b>Motivo:</b> {trip.reason || "—"}</div>
                <div><b>Fecha salida:</b> {trip.departureDateTime || "—"}</div>
                <div><b>Origen:</b> {trip.origin || "—"}</div>
                <div><b>Destino:</b> {trip.destination || "—"}</div>
                <div><b>Fecha llegada:</b> {trip.arrivalDateTime || "—"}</div>
                <div><b>Tipo de carga:</b> {trip.cargoType || "—"}</div>
                <div><b>Kilómetros:</b> {trip.kilometers || "—"}</div>
                <div><b>Ruta autorizada:</b> {trip.authorizedRoute || "—"}</div>
              </div>
            </section>

            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Inspección abreviada pre-viaje</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {Object.entries(inspectionLabels).map(([key, label]) => (
                  <div key={key} className="border rounded p-2">
                    <b>{label}:</b> <BoolText value={Boolean(inspection[key])} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-2">
                <div><b>Inspeccionado por:</b> {inspector.name || "—"}</div>
                <div><b>Puesto:</b> {inspector.position || "—"}</div>
              </div>
            </section>

            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Evaluación de riesgos</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><b>Total evaluación:</b> {risk.total ?? "—"}</div>
                <div><b>Nivel:</b> {risk.level || "—"}</div>
                <div><b>Autorización requerida:</b> {risk.authorization || "—"}</div>
                <div><b>Estado inspección:</b> {risk.inspectionStatus || "—"}</div>
                <div><b>Viaje nocturno:</b> {risk.nightTravel ? "Sí" : "No"}</div>
              </div>
            </section>

            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Firma del conductor</h2>

              {travel.driver_signature || travel.driverSignature ? (
                <img
                  src={travel.driver_signature || travel.driverSignature}
                  alt="Firma conductor"
                  className="max-h-[120px] border rounded bg-white"
                />
              ) : (
                <div className="text-sm text-neutral-600">No registrada en la consulta.</div>
              )}
            </section>

            <section className="border rounded-xl p-4 bg-white space-y-3">
              <h2 className="text-lg font-semibold">Aprobación remota</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><b>Aprobador:</b> {approval.approver_name || "—"}</div>
                <div><b>Cargo:</b> {approval.approver_role || "—"}</div>
                <div><b>Celular:</b> {approval.approver_phone || "—"}</div>
                <div><b>Estado:</b> {approval.status || (uiInfo ? "approved" : "pending")}</div>
                <div><b>Fecha aprobación:</b> {approval.signed_at || (uiInfo ? new Date().toLocaleString() : "—")}</div>
              </div>

              {approverSignature && (
                <div>
                  <div className="text-sm font-semibold mb-2">Firma del aprobador:</div>
                  <img
                    src={approverSignature}
                    alt="Firma aprobador"
                    className="max-h-[120px] border rounded bg-white"
                  />
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {!uiInfo && (
        <section className="border rounded-xl p-4 bg-white space-y-3">
          <div className="font-semibold">Firma del aprobador</div>

          <canvas
            ref={canvasRef}
            className="w-full border rounded bg-white touch-none"
            width={900}
            height={220}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearSignature}
              className="px-4 py-2 border rounded"
            >
              Limpiar
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Aprobar viaje"}
            </button>
          </div>
        </section>
      )}

      {uiInfo && (
        <section className="border rounded-xl p-4 bg-green-50 border-green-200 space-y-4">
          <div>
            <div className="text-green-800 font-semibold text-lg">
              ✅ VIAJE APROBADO
            </div>

            <div className="text-sm text-green-700 mt-1">
              La aprobación remota fue registrada correctamente.
            </div>
          </div>

          <button
            type="button"
            onClick={handleGeneratePdf}
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
          >
            Descargar PDF completo aprobado
          </button>
        </section>
      )}
    </main>
  );
}