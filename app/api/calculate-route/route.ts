import { NextResponse } from "next/server";

async function geocode(place: string) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: `${place}, Colombia`,
      format: "jsonv2",
      limit: "1",
    });

  const res = await fetch(url, {
    headers: {
      "User-Agent": "portal-hseq-ia",
      Referer: "http://localhost:3000",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await res.text();

  if (!text.startsWith("[")) {
    throw new Error(
      `No fue posible consultar coordenadas para: ${place}`
    );
  }

  const data = JSON.parse(text);

  if (!data?.length) {
    throw new Error(
      `No se encontraron coordenadas para: ${place}`
    );
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const origin = String(body?.origin || "").trim();
    const destination = String(body?.destination || "").trim();

    if (!origin || !destination) {
      return NextResponse.json(
        { ok: false, error: "Origen y destino son requeridos." },
        { status: 400 }
      );
    }

    const originCoords = await geocode(origin);
    const destinationCoords = await geocode(destination);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destinationCoords.lon},${destinationCoords.lat}?overview=false`;

    const res = await fetch(osrmUrl);
    const data = await res.json();

    if (!res.ok || data?.code !== "Ok") {
      return NextResponse.json(
        { ok: false, error: "No se pudo calcular la ruta." },
        { status: 500 }
      );
    }

    const route = data.routes?.[0];

    return NextResponse.json({
      ok: true,
      distance_km: Number((route.distance / 1000).toFixed(1)),
      duration_minutes: Math.round(route.duration / 60),
      origin_coords: originCoords,
      destination_coords: destinationCoords,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error calculando ruta." },
      { status: 500 }
    );
  }
}