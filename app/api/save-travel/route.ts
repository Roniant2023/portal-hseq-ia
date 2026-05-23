import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const travelCode =
      "GV-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
  .from("travel_management")
  .insert([
    {
      travel_code: travelCode,
      vehicle_json: body.vehicle ?? {},
      driver_json: body.driver ?? {},
      documents_json: body.documents ?? {},
      trip_json: body.trip ?? {},
      inspection_json: body.inspection ?? {},
      risk_json: body.risk ?? {},
      authorization_json: body.authorization ?? {},
      full_json: body,
    },
  ])
  .select()
  .single();
    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
      travel_code: travelCode,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Unexpected error",
      },
      { status: 500 }
    );
  }
}