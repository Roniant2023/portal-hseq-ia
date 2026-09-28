import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = String(searchParams.get("token") || "").trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "token es requerido." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: linkRow, error: linkError } = await supabase
      .from("ats_approval_links")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (linkError) {
      return NextResponse.json(
        { ok: false, error: linkError.message },
        { status: 500 }
      );
    }

    if (!linkRow) {
      return NextResponse.json(
        { ok: false, error: "Link no encontrado." },
        { status: 404 }
      );
    }

    if (linkRow.status === "signed") {
      return NextResponse.json(
        {
          ok: false,
          error: "Este link ya fue utilizado para aprobar el ATS.",
          approval_link: linkRow,
        },
        { status: 400 }
      );
    }

    if (linkRow.expires_at && new Date(linkRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          error: "El link de aprobación ha expirado.",
          approval_link: linkRow,
        },
        { status: 400 }
      );
    }

    const { data: atsRow, error: atsError } = await supabase
      .from("ats_records")
      .select("*")
      .eq("id", linkRow.ats_id)
      .maybeSingle();

    if (atsError) {
      return NextResponse.json(
        { ok: false, error: atsError.message },
        { status: 500 }
      );
    }

    if (!atsRow) {
      return NextResponse.json(
        { ok: false, error: "ATS asociado no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        approval_link: {
          id: linkRow.id,
          ats_id: linkRow.ats_id,
          token: linkRow.token,
          status: linkRow.status,
          expires_at: linkRow.expires_at,
          signed_at: linkRow.signed_at ?? null,
          access_validated: linkRow.access_validated ?? false,
          approver_name: linkRow.approver_name ?? "",
          approver_role: linkRow.approver_role ?? "",
          approver_email: linkRow.approver_email ?? "",
          approver_phone: linkRow.approver_phone ?? "",
        },
        ats_record: atsRow,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}