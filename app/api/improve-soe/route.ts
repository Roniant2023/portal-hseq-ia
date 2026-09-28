import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SOEAction =
  | "improve_description"
  | "suggest_immediate_action"
  | "suggest_recommendation";

function buildPrompt(input: {
  action: SOEAction;
  descripcion_original?: string;
  descripcion_mejorada?: string;
  tipo_observacion?: string;
  area_unidad?: string;
  operacion_tarea?: string;
}) {
  const descripcionBase =
    input.descripcion_mejorada?.trim() || input.descripcion_original?.trim() || "";

  if (input.action === "improve_description") {
    return `
Actúa como especialista HSEQ del sector hidrocarburos.
Mejora la redacción de una observación de campo tipo SOE.

Instrucciones:
- Escribe en español técnico, claro y profesional.
- Mantén el sentido original.
- No inventes hechos no mencionados.
- Redacta en un solo párrafo.
- Enfócate en describir el hallazgo de forma objetiva.
- Evita exageraciones y lenguaje ambiguo.

Texto original:
"""${input.descripcion_original || ""}"""
`.trim();
  }

  if (input.action === "suggest_immediate_action") {
    return `
Actúa como especialista HSEQ del sector hidrocarburos.
Redacta una acción inmediata para una observación SOE.

Instrucciones:
- Responde en español técnico y concreto.
- Debe ser una acción inmediata, ejecutable y breve.
- Enfócate en controlar el riesgo o corregir la condición observada.
- No incluyas títulos ni viñetas.
- Máximo 2 oraciones.

Contexto:
- Tipo de observación: ${input.tipo_observacion || "No informado"}
- Área / unidad: ${input.area_unidad || "No informada"}
- Operación / tarea: ${input.operacion_tarea || "No informada"}
- Descripción: ${descripcionBase}
`.trim();
  }

  return `
Actúa como especialista HSEQ del sector hidrocarburos.
Redacta una recomendación preventiva o de mejora para una observación SOE.

Instrucciones:
- Responde en español técnico y profesional.
- Debe orientar a prevenir recurrencia.
- Puede incluir enfoque administrativo, operativo o de control.
- No incluyas títulos ni viñetas.
- Máximo 3 oraciones.

Contexto:
- Tipo de observación: ${input.tipo_observacion || "No informado"}
- Área / unidad: ${input.area_unidad || "No informada"}
- Operación / tarea: ${input.operacion_tarea || "No informada"}
- Descripción: ${descripcionBase}
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const action = body?.action as SOEAction | undefined;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Falta action." },
        { status: 400 }
      );
    }

    if (
      action === "improve_description" &&
      !String(body?.descripcion_original || "").trim()
    ) {
      return NextResponse.json(
        { ok: false, error: "Falta descripcion_original." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt({
      action,
      descripcion_original: body?.descripcion_original,
      descripcion_mejorada: body?.descripcion_mejorada,
      tipo_observacion: body?.tipo_observacion,
      area_unidad: body?.area_unidad,
      operacion_tarea: body?.operacion_tarea,
    });

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const text = (response.output_text || "").trim();

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "La IA no devolvió contenido." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      result: text,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Error inesperado.",
      },
      { status: 500 }
    );
  }
}