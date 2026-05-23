import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const token = Math.random().toString(36).substring(2, 12).toUpperCase();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data, error } = await supabase
      .from("travel_approval_links")
      .insert([
        {
          travel_id: body.travel_id,
          token,
          approver_name: body.approver_name,
          approver_role: body.approver_role,
          approver_phone: body.approver_phone,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data,
      token,
      approval_url: `${siteUrl}/gestion-viajes/aprobar/${token}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Error generando link" },
      { status: 500 }
    );
  }
}