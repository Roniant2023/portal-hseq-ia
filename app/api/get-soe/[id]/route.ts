import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
const companyConfig = getCompanyConfig();
    const { data, error } = await supabase
      .from("soe_records")
.select("*")
.eq("id", id)
.eq("empresa", companyConfig.name)
.single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Error consultando observación",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Excepción en get-soe/[id]",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}