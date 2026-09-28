import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageBase64 = body?.imageBase64;
    const mimeType = body?.mimeType || "image/jpeg";

    if (!imageBase64) {
      return NextResponse.json(
        { ok: false, error: "No se recibió imagen." },
        { status: 400 }
      );
    }

    const prompt = `
Eres un analista HSSEQ experto en operaciones industriales y de campo.

Analiza la imagen recibida y responde SOLO en JSON válido con esta estructura exacta:

{
  "descripcion_visual": "string",
  "accion_inmediata": "string",
  "recomendacion": "string"
}

Instrucciones:
- Describe únicamente lo observable en la imagen.
- No inventes datos no visibles.
- Usa lenguaje técnico, claro y profesional.
- Enfócate en posibles hallazgos de seguridad, orden, condiciones locativas, actos o condiciones inseguras, si son visibles.
- Si no se identifica un riesgo claro, indícalo con prudencia.
- La redacción debe ser útil para una tarjeta SOE.
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
            {
  type: "input_image",
  image_url: `data:${mimeType};base64,${imageBase64}`,
  detail: "auto",
},
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "soe_image_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              descripcion_visual: { type: "string" },
              accion_inmediata: { type: "string" },
              recomendacion: { type: "string" },
            },
            required: [
              "descripcion_visual",
              "accion_inmediata",
              "recomendacion",
            ],
          },
        },
      },
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      return NextResponse.json(
        { ok: false, error: "La IA no devolvió contenido." },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        { ok: false, error: "La respuesta de IA no fue JSON válido." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      result: parsed,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Error analizando imagen",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}