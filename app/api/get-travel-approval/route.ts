import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token requerido.",
        },
        { status: 400 }
      );
    }

    const { data: approval, error: approvalError } =
      await supabase
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

    const { data: travel, error: travelError } =
      await supabase
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
      travel,
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