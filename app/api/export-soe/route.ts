import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { getCompanyConfig } from "@/lib/company-config";
export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Faltan variables de Supabase.");
  }

  return createClient(url, serviceRole);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
const companyConfig = getCompanyConfig();

    const { data, error } = await supabase
      .from("soe_records")
.select("*")
.eq("empresa", companyConfig.name)
.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Error consultando registros",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const rows = (data || []).map((r) => ({
      ID: r.id ?? "",
      Fecha: r.fecha ?? "",
      Cedula: r.cedula ?? "",
      Nombre: r.nombre ?? "",
      Cargo: r.cargo ?? "",
      Empresa: r.empresa ?? "",
      Ubicacion: r.ubicacion ?? "",
      Frente_Equipo: r.frente_equipo ?? "",
      Tipo_Observacion: r.tipo_observacion ?? "",
      Se_Detuvo_Tarea: r.se_detuvo_tarea ?? "",
      Area_Unidad: r.area_unidad ?? "",
      Area_Otro: r.area_otro ?? "",
      Operacion_Tarea: r.operacion_tarea ?? "",
      Operacion_Otro: r.operacion_otro ?? "",
      Descripcion_Original: r.descripcion_original ?? "",
      Descripcion_Mejorada: r.descripcion_mejorada ?? "",
      Accion_Inmediata: r.accion_inmediata ?? "",
      Recomendacion: r.recomendacion ?? "",
      Supervisor_Control: r.supervisor_control ?? "",
      Requiere_Seguimiento: r.requiere_seguimiento ?? "",
      Requiere_AIL: r.requiere_ail ?? "",
      Estado: r.estado ?? "",
      Creado_En: r.created_at ?? "",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, worksheet, "SOE");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="historial-soe.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Excepción exportando Excel",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}