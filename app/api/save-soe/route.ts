import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCompanyConfig } from "@/lib/company-config";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRole) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRole);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const form = body?.form;

    if (!form || typeof form !== "object") {
      return NextResponse.json(
        { ok: false, error: "Payload inválido. Falta form." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
const companyConfig = getCompanyConfig();
    const payload = {

      fecha: form.fecha || null,
      cedula: form.cedula || null,
      cargo: form.cargo || null,
      nombre: form.nombre || null,
      empresa: companyConfig.name,
      ubicacion: form.ubicacion || null,
      frente_equipo: form.frente_equipo || null,

      tipo_observacion: form.tipo_observacion || null,
      se_detuvo_tarea: form.se_detuvo_tarea || null,
      area_unidad: form.area_unidad || null,
      area_otro: form.area_otro || null,
      operacion_tarea: form.operacion_tarea || null,
      operacion_otro: form.operacion_otro || null,

      descripcion_original: form.descripcion_original || null,
      descripcion_mejorada: form.descripcion_mejorada || null,
      accion_inmediata: form.accion_inmediata || null,
      recomendacion: form.recomendacion || null,

      supervisor_control: form.supervisor_control || null,
      requiere_seguimiento: form.requiere_seguimiento || null,
      requiere_ail: form.requiere_ail || null,
      estado: form.estado || "Abierto",

      raw_json: form,
    };

    console.log("Payload SOE:", payload);

    const { data, error } = await supabase
      .from("soe_records")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Error insertando en Supabase",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err: any) {
    console.error("save-soe exception:", err);

    return NextResponse.json(
      {
        ok: false,
        error: "Excepción guardando SOE",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}