"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

    const data = canvasRef.current?.toDataURL("image/png") || "";

    setSignature(data);
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
          token: token,
          signature_data: signature,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setUiError(data?.error || "No se pudo guardar la aprobación.");
        return;
      }

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
          body: JSON.stringify({
            token: token,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          setUiError(data?.error || "No se pudo cargar la gestión de viaje.");
          return;
        }

        setTravel(data.travel);
      } catch (err: any) {
        setUiError(err?.message || "Error cargando gestión de viaje.");
      } finally {
        setLoading(false);
      }
    }

    loadTravel();
  }, [token]);

  return (
    <main ref={pdfRef} className="max-w-xl mx-auto p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Aprobación de viaje</h1>

        <p className="text-sm text-neutral-600">
          Registra tu firma para autorizar la gestión de viaje.
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

      {loading && (
        <div className="text-sm text-neutral-600">
          Cargando gestión de viaje...
        </div>
      )}

      {travel && (
        <section className="border rounded-xl p-4 bg-white space-y-3">
          <div className="font-semibold">Resumen de la gestión de viaje</div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <b>Código:</b> {travel.travel_code || "—"}
            </div>

            <div>
              <b>Conductor:</b> {travel.driver_json?.name || "—"}
            </div>

            <div>
              <b>Empresa:</b> {travel.driver_json?.company || "—"}
            </div>

            <div>
              <b>Vehículo:</b>{" "}
              {(travel.vehicle_json?.brand || "—") +
                " / " +
                (travel.vehicle_json?.type || "—") +
                " / " +
                (travel.vehicle_json?.plate || "—")}
            </div>

            <div>
              <b>Origen:</b> {travel.trip_json?.origin || "—"}
            </div>

            <div>
              <b>Destino:</b> {travel.trip_json?.destination || "—"}
            </div>

            <div>
              <b>Fecha salida:</b>{" "}
              {travel.trip_json?.departureDateTime || "—"}
            </div>

            <div>
              <b>Motivo:</b> {travel.trip_json?.reason || "—"}
            </div>

            <div>
              <b>Total riesgo:</b> {travel.risk_json?.total ?? "—"}
            </div>

            <div>
              <b>Nivel:</b> {travel.risk_json?.level || "—"}
            </div>

            <div>
              <b>Autorización requerida:</b>{" "}
              {travel.risk_json?.authorization || "—"}
            </div>
          </div>
        </section>
      )}

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
            Descargar PDF aprobado
          </button>
        </section>
      )}
    </main>
  );
}