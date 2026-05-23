import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.travel_id) {
      return NextResponse.json(
        { ok: false, error: "Falta travel_id." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("travel_approval_links")
      .select("*")
      .eq("travel_id", body.travel_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "Aprobación no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      approval: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error consultando aprobación." },
      { status: 500 }
    );
  }
}