"use client";

import { useEffect, useRef, useState } from "react";

type FirmaCanvasProps = {
  onChange: (firma: Blob | null) => void;
};

export default function FirmaCanvas({
  onChange,
}: FirmaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dibujandoRef = useRef(false);
  const ultimoPuntoRef = useRef<{ x: number; y: number } | null>(null);

  const [tieneFirma, setTieneFirma] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ajustarCanvas = () => {
      const contenedor = canvas.parentElement;

      if (!contenedor) return;

      const rect = contenedor.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;

      canvas.width = rect.width * ratio;
      canvas.height = 220 * ratio;

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = "220px";

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
    };

    ajustarCanvas();

    window.addEventListener("resize", ajustarCanvas);

    return () => {
      window.removeEventListener("resize", ajustarCanvas);
    };
  }, []);

  function obtenerPunto(
    evento: React.PointerEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: evento.clientX - rect.left,
      y: evento.clientY - rect.top,
    };
  }

  function iniciarFirma(
    evento: React.PointerEvent<HTMLCanvasElement>
  ) {
    evento.preventDefault();

    dibujandoRef.current = true;

    const punto = obtenerPunto(evento);

    ultimoPuntoRef.current = punto;

    canvasRef.current?.setPointerCapture(
      evento.pointerId
    );
  }

  function dibujar(
    evento: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (!dibujandoRef.current) return;

    evento.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const puntoActual = obtenerPunto(evento);
    const puntoAnterior = ultimoPuntoRef.current;

    if (!puntoAnterior) {
      ultimoPuntoRef.current = puntoActual;
      return;
    }

    ctx.beginPath();
    ctx.moveTo(puntoAnterior.x, puntoAnterior.y);
    ctx.lineTo(puntoActual.x, puntoActual.y);
    ctx.stroke();

    ultimoPuntoRef.current = puntoActual;

    if (!tieneFirma) {
      setTieneFirma(true);
    }
  }

  function terminarFirma(
    evento: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (!dibujandoRef.current) return;

    evento.preventDefault();

    dibujandoRef.current = false;
    ultimoPuntoRef.current = null;

    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        onChange(blob);
      },
      "image/png"
    );
  }

  function limpiarFirma() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    setTieneFirma(false);
    onChange(null);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={iniciarFirma}
          onPointerMove={dibujar}
          onPointerUp={terminarFirma}
          onPointerCancel={terminarFirma}
          className="block w-full touch-none cursor-crosshair"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-500">
          Firma dentro del recuadro usando el dedo,
          mouse o lápiz.
        </p>

        <button
          type="button"
          onClick={limpiarFirma}
          disabled={!tieneFirma}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          Limpiar firma
        </button>
      </div>
    </div>
  );
}