import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

// Se puede cambiar posteriormente desde Vercel sin modificar código.
const EPP_VISION_MODEL =
  process.env.EPP_VISION_MODEL || "gpt-5-mini";

/* =========================================================
   TIPOS
========================================================= */

type FotoReposicion = {
  id: string;
  ruta_storage: string;
  nombre_archivo: string | null;
  orden: number;
};

type HallazgoIA = {
  tipo: string;
  descripcion: string;
  imagen_referencia: string;
};

type AnalisisIA = {
  resumen: string;
  hallazgos: HallazgoIA[];
  severidad_visible:
    | "BAJA"
    | "MEDIA"
    | "ALTA"
    | "NO_DETERMINABLE";
  calidad_evidencia:
    | "DEFICIENTE"
    | "ACEPTABLE"
    | "BUENA";
  consistencia_imagenes: string;
  evaluacion_soporte: string;
  recomendacion_apoyo: string;
  advertencias: string;
};

/* =========================================================
   HELPERS
========================================================= */

function textoSeguro(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: NextRequest) {
  try {
    /* =====================================================
       1. VALIDAR CONFIGURACIÓN DEL SERVIDOR
    ===================================================== */

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "Falta configuración de Supabase en el servidor.",
        },
        { status: 500 }
      );
    }

    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY no está configurada en el servidor.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       2. VALIDAR SESIÓN DEL USUARIO
    ===================================================== */

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          error: "Sesión no válida.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization
      .replace("Bearer ", "")
      .trim();

    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user: usuarioSolicitante },
      error: userError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (userError || !usuarioSolicitante) {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida o expiró.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       3. CLIENTE SUPABASE ADMINISTRATIVO
       SOLO EXISTE DEL LADO DEL SERVIDOR
    ===================================================== */

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /* =====================================================
       4. VALIDAR PERMISO DE APROBACIÓN EPP
    ===================================================== */

    const {
      data: puedeAprobar,
      error: permisoError,
    } = await supabaseAdmin.rpc(
      "puede_aprobar_reposiciones_epp",
      {
        p_user_id: usuarioSolicitante.id,
      }
    );

    if (permisoError) {
      console.error(
        "Error verificando permiso EPP:",
        permisoError
      );

      return NextResponse.json(
        {
          error:
            "No fue posible verificar los permisos del usuario.",
        },
        { status: 500 }
      );
    }

    if (puedeAprobar !== true) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para analizar reposiciones de EPP.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       5. LEER ID DE LA REPOSICIÓN
    ===================================================== */

    const body = await request.json();

    const reposicionId =
      typeof body?.reposicion_id === "string"
        ? body.reposicion_id.trim()
        : "";

    if (!reposicionId) {
      return NextResponse.json(
        {
          error:
            "Debes indicar la reposición que se va a analizar.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       6. CONSULTAR SOLICITUD DE REPOSICIÓN
    ===================================================== */

    const {
      data: reposicion,
      error: reposicionError,
    } = await supabaseAdmin
      .from("epp_reposiciones")
      .select(`
        id,
        motivo,
        estado_epp_anterior,
        justificacion,
        requiere_aprobacion,
        estado,
        trabajador_id,
        epp_id,
        ubicacion_id
      `)
      .eq("id", reposicionId)
      .single();

    if (reposicionError || !reposicion) {
      return NextResponse.json(
        {
          error:
            "No se encontró la solicitud de reposición.",
        },
        { status: 404 }
      );
    }

    if (reposicion.requiere_aprobacion !== true) {
      return NextResponse.json(
        {
          error:
            "Esta reposición no requiere aprobación especial.",
        },
        { status: 400 }
      );
    }

    /*
      Permitimos analizar una solicitud pendiente de aprobación.

      La IA NO cambia este estado.
    */
    if (reposicion.estado !== "PENDIENTE_APROBACION") {
      return NextResponse.json(
        {
          error:
            "Solo pueden analizarse solicitudes pendientes de aprobación.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       7. CONSULTAR INFORMACIÓN DEL EPP
    ===================================================== */

    const {
      data: epp,
      error: eppError,
    } = await supabaseAdmin
      .from("epp_catalogo")
      .select(
        "id, codigo, nombre, requiere_aprobacion_reposicion"
      )
      .eq("id", reposicion.epp_id)
      .single();

    if (eppError || !epp) {
      console.error(
        "Error consultando catálogo EPP:",
        eppError
      );

      return NextResponse.json(
        {
          error:
            "No fue posible obtener la información del EPP.",
        },
        { status: 500 }
      );
    }

    if (
      epp.requiere_aprobacion_reposicion !== true
    ) {
      return NextResponse.json(
        {
          error:
            "El EPP seleccionado no está configurado para análisis de reposición protegida.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       8. CONSULTAR FOTOGRAFÍAS
    ===================================================== */

    const {
      data: fotos,
      error: fotosError,
    } = await supabaseAdmin
      .from("epp_reposiciones_fotos")
      .select(
        "id, ruta_storage, nombre_archivo, orden"
      )
      .eq("reposicion_id", reposicionId)
      .order("orden", { ascending: true });

    if (fotosError) {
      console.error(
        "Error consultando fotografías:",
        fotosError
      );

      return NextResponse.json(
        {
          error:
            "No fue posible consultar las fotografías de la reposición.",
        },
        { status: 500 }
      );
    }

    const listaFotos =
      (fotos || []) as FotoReposicion[];

    if (listaFotos.length < 3) {
      return NextResponse.json(
        {
          error:
            "Se requieren al menos 3 fotografías para realizar el análisis con IA.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       9. DESCARGAR FOTOGRAFÍAS DEL BUCKET PRIVADO
    ===================================================== */

    const imagenes: Array<{
      type: "input_image";
      image_url: string;
      detail: "high";
    }> = [];

    for (const foto of listaFotos.slice(0, 5)) {
      const {
        data: archivo,
        error: descargaError,
      } = await supabaseAdmin.storage
        .from("epp-reposiciones")
        .download(foto.ruta_storage);

      if (descargaError || !archivo) {
        console.error(
          "Error descargando fotografía:",
          foto.ruta_storage,
          descargaError
        );

        return NextResponse.json(
          {
            error:
              "No fue posible descargar una de las fotografías de la reposición.",
          },
          { status: 500 }
        );
      }

      const arrayBuffer =
        await archivo.arrayBuffer();

      const base64 = Buffer.from(
        arrayBuffer
      ).toString("base64");

      const mimeType =
        archivo.type || "image/jpeg";

      imagenes.push({
        type: "input_image",
        image_url: `data:${mimeType};base64,${base64}`,
        detail: "high",
      });
    }

    /* =====================================================
       10. REGLAS ESPECIALES DEL ANÁLISIS
    ===================================================== */

    const nombreEpp =
      textoSeguro(epp.nombre);

    const codigoEpp =
      textoSeguro(epp.codigo);

    const esOverolIgnifugo =
      codigoEpp.toUpperCase() === "EPP-023" ||
      nombreEpp
        .toLowerCase()
        .includes("ignífugo") ||
      nombreEpp
        .toLowerCase()
        .includes("ignifugo");

    const advertenciaIgnifugo =
      esOverolIgnifugo
        ? `
REGLA ESPECIAL PARA OVEROL IGNÍFUGO:

Las fotografías pueden utilizarse para identificar
únicamente condiciones VISIBLES como:

- roturas;
- perforaciones;
- abrasión;
- desgaste;
- costuras abiertas;
- quemaduras visibles;
- contaminación visible;
- pérdida visible de material;
- otras alteraciones físicas observables.

NO puedes determinar ni certificar mediante fotografías:

- pérdida de propiedades ignífugas;
- conservación de propiedades ignífugas;
- resistencia térmica;
- cumplimiento de especificaciones FR;
- capacidad protectora residual del material;
- aptitud definitiva para continuar en servicio.

Cuando exista una condición que no pueda comprobarse
visualmente, debes indicarla como una limitación y
remitirla a evaluación humana.
`
        : "";

    /* =====================================================
       11. PROMPT HSEQ
    ===================================================== */

    const prompt = `
Eres un asistente técnico de apoyo para la gestión HSEQ
de Elementos de Protección Personal (EPP).

Analizarás evidencia fotográfica correspondiente a una
solicitud de reposición de un EPP.

PRINCIPIO FUNDAMENTAL:

TU ANÁLISIS ES ÚNICAMENTE INFORMATIVO Y DE APOYO.

NO APRUEBAS LA REPOSICIÓN.
NO RECHAZAS LA REPOSICIÓN.
NO TOMAS DECISIONES AUTOMÁTICAS.
NO DETERMINAS DE FORMA DEFINITIVA SI EL EPP ES APTO O NO APTO.
NO SUSTITUYES LA EVALUACIÓN DEL APROBADOR HUMANO.

La decisión final corresponde exclusivamente al
aprobador HSEQ autorizado.

--------------------------------------------------
INFORMACIÓN DE LA SOLICITUD
--------------------------------------------------

Código EPP:
${codigoEpp || "No informado"}

Nombre EPP:
${nombreEpp || "No informado"}

Motivo de reposición:
${textoSeguro(reposicion.motivo) || "No informado"}

Estado anterior reportado:
${
  textoSeguro(reposicion.estado_epp_anterior) ||
  "No informado"
}

Justificación del solicitante:
${
  textoSeguro(reposicion.justificacion) ||
  "No informada"
}

${advertenciaIgnifugo}

--------------------------------------------------
CRITERIOS DE ANÁLISIS
--------------------------------------------------

Analiza exclusivamente aquello que sea razonablemente
observable en las fotografías.

Debes evaluar:

1. Calidad de la evidencia fotográfica.

Determina si las fotografías permiten observar
adecuadamente el EPP y la condición reportada.

2. Hallazgos visibles.

Describe únicamente daños, desgaste, contaminación,
deformaciones u otras condiciones que realmente sean
visibles.

No inventes daños.

3. Localización aparente.

Cuando sea posible, indica la zona del EPP donde se
observa la condición.

4. Severidad visual aparente.

Clasifica exclusivamente la severidad VISUAL como:

BAJA
MEDIA
ALTA
NO_DETERMINABLE

Esta clasificación NO representa una declaración
de aptitud o no aptitud del EPP.

5. Consistencia entre fotografías.

Indica si las imágenes parecen mostrar el mismo EPP
y si presentan la condición desde diferentes ángulos
de manera consistente.

Si no puedes determinarlo, dilo expresamente.

6. Correspondencia con la justificación.

Compara únicamente lo reportado por el solicitante
con lo que es visible.

No asumas que la justificación es verdadera solamente
porque fue escrita por el usuario.

7. Limitaciones.

Indica cualquier aspecto que no pueda determinarse
mediante fotografías.

8. Recomendación de apoyo.

Entrega únicamente una orientación técnica para que
el aprobador humano realice su evaluación.

Puedes indicar, por ejemplo:

- evidencia visual suficiente para evaluación humana;
- evidencia parcialmente suficiente;
- solicitar fotografías adicionales;
- solicitar inspección física;
- verificar una condición técnica no observable.

NO utilices expresiones como:

"aprobar"
"rechazar"
"reposición aprobada"
"reposición rechazada"
"debe aprobarse"
"debe rechazarse"

--------------------------------------------------
SALIDA
--------------------------------------------------

Devuelve SOLAMENTE JSON válido.

No uses Markdown.
No agregues texto antes o después del JSON.

La estructura debe ser exactamente:

{
  "resumen": "texto",
  "hallazgos": [
    {
      "tipo": "texto",
      "descripcion": "texto",
      "imagen_referencia": "texto"
    }
  ],
  "severidad_visible": "BAJA | MEDIA | ALTA | NO_DETERMINABLE",
  "calidad_evidencia": "DEFICIENTE | ACEPTABLE | BUENA",
  "consistencia_imagenes": "texto",
  "evaluacion_soporte": "texto",
  "recomendacion_apoyo": "texto",
  "advertencias": "texto"
}
`.trim();

    /* =====================================================
       12. LLAMADA A OPENAI
    ===================================================== */

    const response =
  await new OpenAI({
    apiKey: openaiApiKey,
  }).responses.create({
    model: EPP_VISION_MODEL,

    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
          ...imagenes,
        ],
      },
    ],

    text: {
      format: {
        type: "json_schema",
        name: "analisis_reposicion_epp",
        strict: true,
        schema: {
          type: "object",
          properties: {
            resumen: {
              type: "string",
            },
            hallazgos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: {
                    type: "string",
                  },
                  descripcion: {
                    type: "string",
                  },
                  imagen_referencia: {
                    type: "string",
                  },
                },
                required: [
                  "tipo",
                  "descripcion",
                  "imagen_referencia",
                ],
                additionalProperties: false,
              },
            },
            severidad_visible: {
              type: "string",
              enum: [
                "BAJA",
                "MEDIA",
                "ALTA",
                "NO_DETERMINABLE",
              ],
            },
            calidad_evidencia: {
              type: "string",
              enum: [
                "DEFICIENTE",
                "ACEPTABLE",
                "BUENA",
              ],
            },
            consistencia_imagenes: {
              type: "string",
            },
            evaluacion_soporte: {
              type: "string",
            },
            recomendacion_apoyo: {
              type: "string",
            },
            advertencias: {
              type: "string",
            },
          },
          required: [
            "resumen",
            "hallazgos",
            "severidad_visible",
            "calidad_evidencia",
            "consistencia_imagenes",
            "evaluacion_soporte",
            "recomendacion_apoyo",
            "advertencias",
          ],
          additionalProperties: false,
        },
      },
    },

    max_output_tokens: 2500,
  });
    const textoRespuesta =
      (response.output_text || "").trim();

    if (!textoRespuesta) {
      return NextResponse.json(
        {
          error:
            "La IA no produjo un resultado de análisis.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       13. INTERPRETAR JSON
    ===================================================== */

    let analisis: AnalisisIA;

    try {
      analisis =
        JSON.parse(textoRespuesta) as AnalisisIA;
    } catch (parseError) {
      console.error(
        "Respuesta IA no parseable:",
        textoRespuesta,
        parseError
      );

      return NextResponse.json(
        {
          error:
            "La respuesta de la IA no pudo ser interpretada.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       14. NORMALIZAR RESPUESTA
    ===================================================== */

    const severidadesPermitidas = [
      "BAJA",
      "MEDIA",
      "ALTA",
      "NO_DETERMINABLE",
    ];

    const calidadesPermitidas = [
      "DEFICIENTE",
      "ACEPTABLE",
      "BUENA",
    ];

    const severidad =
      severidadesPermitidas.includes(
        analisis.severidad_visible
      )
        ? analisis.severidad_visible
        : "NO_DETERMINABLE";

    const calidad =
      calidadesPermitidas.includes(
        analisis.calidad_evidencia
      )
        ? analisis.calidad_evidencia
        : "DEFICIENTE";

    const hallazgos =
      Array.isArray(analisis.hallazgos)
        ? analisis.hallazgos
        : [];

    /*
      Advertencia institucional que siempre se agrega,
      independientemente de la respuesta del modelo.
    */
    const advertenciaInstitucional =
      "Análisis asistido por IA únicamente informativo. " +
      "No constituye aprobación, rechazo, certificación " +
      "de aptitud ni decisión automática. La decisión " +
      "corresponde exclusivamente al aprobador humano autorizado.";

    const advertenciasModelo =
      textoSeguro(analisis.advertencias);

    const advertenciasFinales =
      advertenciasModelo
        ? `${advertenciasModelo}\n\n${advertenciaInstitucional}`
        : advertenciaInstitucional;

    /* =====================================================
       15. GUARDAR ANÁLISIS EN SUPABASE
    ===================================================== */

    const {
      data: registroAnalisis,
      error: guardarError,
    } = await supabaseAdmin
      .from("epp_reposiciones_analisis_ia")
      .insert({
        reposicion_id: reposicionId,

        modelo: EPP_VISION_MODEL,

        resumen:
          textoSeguro(analisis.resumen) || null,

        hallazgos,

        severidad_visible: severidad,

        calidad_evidencia: calidad,

        consistencia_imagenes:
          textoSeguro(
            analisis.consistencia_imagenes
          ) || null,

        evaluacion_soporte:
          textoSeguro(
            analisis.evaluacion_soporte
          ) || null,

        recomendacion_apoyo:
          textoSeguro(
            analisis.recomendacion_apoyo
          ) || null,

        advertencias:
          advertenciasFinales,

        /*
          ESTE VALOR NO DEPENDE DE LA IA.
          SIEMPRE ES FALSE.
        */
        decision_automatica: false,

        analizado_por:
          usuarioSolicitante.id,
      })
      .select()
      .single();

    if (guardarError) {
      console.error(
        "Error guardando análisis IA:",
        guardarError
      );

      return NextResponse.json(
        {
          error:
            "El análisis fue generado, pero no pudo guardarse.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       16. RESPUESTA AL FRONTEND
    ===================================================== */

    return NextResponse.json(
      {
        ok: true,

        mensaje:
          "Análisis asistido por IA generado correctamente. La decisión continúa siendo responsabilidad exclusiva del aprobador humano.",

        analisis: registroAnalisis,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Error análisis IA reposición EPP:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado durante el análisis de las imágenes.",
      },
      { status: 500 }
    );
  }
}