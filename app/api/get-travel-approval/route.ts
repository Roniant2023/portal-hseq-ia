import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body?.token || "").trim();

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token requerido.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: approval, error: approvalError } = await supabase
      .from("travel_approval_links")
      .select("*")
      .eq("token", token)
      .single();

    if (approvalError || !approval) {
      return NextResponse.json(
        {
          ok: false,
          error: "Link de aprobación no encontrado.",
        },
        { status: 404 }
      );
    }

    const { data: travel, error: travelError } = await supabase
      .from("travel_management")
      .select("*")
      .eq("id", approval.travel_id)
      .single();

    if (travelError || !travel) {
      return NextResponse.json(
        {
          ok: false,
          error: "Gestión de viaje no encontrada.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      travel: {
        ...travel,
        approval_json: {
          id: approval.id,
          token: approval.token,
          status: approval.status,
          approver_name: approval.approver_name,
          approver_role: approval.approver_role,
          approver_phone: approval.approver_phone,
          signature_data: approval.signature_data,
          signed_at: approval.signed_at,
          expires_at: approval.expires_at,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Error interno.",
      },
      { status: 500 }
    );
  }
}