import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.token || !body.signature_data) {
      return NextResponse.json(
        { ok: false, error: "Faltan token o firma." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("travel_approval_links")
      .update({
        status: "signed",
        signature_data: body.signature_data,
        signed_at: new Date().toISOString(),
      })
      .eq("token", body.token)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Error guardando firma." },
      { status: 500 }
    );
  }
}