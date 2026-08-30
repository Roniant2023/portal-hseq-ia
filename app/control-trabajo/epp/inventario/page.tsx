"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Epp = {
  id: string;
  codigo: string;
  nombre: string;
};

type Ubicacion = {
  id: string;
  nombre: string;
};

type Inventario = {
  id: string;
  epp_id: string;
  ubicacion_id: string;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  fecha_ingreso: string;
  fecha_vencimiento: string | null;
  cantidad_inicial: number;
  cantidad_disponible: number;
  estado: string;
  epp_catalogo?: {
    codigo: string;
    nombre: string;
  } | null;
  epp_ubicaciones?: {
    nombre: string;
  } | null;
};

type FiltroStock = "TODOS" | "CON_STOCK" | "BAJO" | "AGOTADO";

export default function InventarioEppPage() {
  const [catalogo, setCatalogo] = useState<Epp[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [filtroEpp, setFiltroEpp] = useState("");
  const [filtroTalla, setFiltroTalla] = useState("");
  const [filtroStock, setFiltroStock] = useState<FiltroStock>("TODOS");
  const [umbralBajo, setUmbralBajo] = useState(20);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [respuestaEpp, respuestaUbicaciones, respuestaInventario] =
      await Promise.all([
        supabase
          .from("epp_catalogo")
          .select("id,codigo,nombre")
          .eq("activo", true)
          .order("codigo"),

        supabase
          .from("epp_ubicaciones")
          .select("id,nombre")
          .eq("activo", true)
          .order("nombre"),

        supabase
          .from("epp_inventario")
          .select(`
            id,
            epp_id,
            ubicacion_id,
            talla,
            lote,
            serial,
            fecha_ingreso,
            fecha_vencimiento,
            cantidad_inicial,
            cantidad_disponible,
            estado,
            epp_catalogo (
              codigo,
              nombre
            ),
            epp_ubicaciones (
              nombre
            )
          `)
          .order("created_at", { ascending: false }),
      ]);

    if (respuestaEpp.error) {
      console.error(respuestaEpp.error);
    } else {
      setCatalogo((respuestaEpp.data ?? []) as unknown as Epp[]);
    }

    if (respuestaUbicaciones.error) {
      console.error(respuestaUbicaciones.error);
    } else {
      setUbicaciones(
        (respuestaUbicaciones.data ?? []) as unknown as Ubicacion[]
      );
    }

    if (respuestaInventario.error) {
      console.error(respuestaInventario.error);
      setError(
        `No fue posible consultar el inventario: ${respuestaInventario.error.message}`
      );
    } else {
      setInventario(
        (respuestaInventario.data ?? []) as unknown as Inventario[]
      );
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const tallas = useMemo(() => {
    return Array.from(
      new Set(
        inventario
          .map((item) => item.talla?.trim())
          .filter((talla): talla is string => Boolean(talla))
      )
    ).sort((a, b) =>
      a.localeCompare(b, "es", { numeric: true, sensitivity: "base" })
    );
  }, [inventario]);

  const inventarioFiltrado = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return inventario.filter((item) => {
      if (filtroUbicacion && item.ubicacion_id !== filtroUbicacion) {
        return false;
      }

      if (filtroEpp && item.epp_id !== filtroEpp) {
        return false;
      }

      if (
        filtroTalla &&
        (item.talla ?? "").trim().toUpperCase() !== filtroTalla.toUpperCase()
      ) {
        return false;
      }

      const disponible = Number(item.cantidad_disponible || 0);

      if (filtroStock === "CON_STOCK" && disponible <= 0) return false;
      if (
        filtroStock === "BAJO" &&
        !(disponible > 0 && disponible <= umbralBajo)
      ) {
        return false;
      }
      if (filtroStock === "AGOTADO" && disponible !== 0) return false;

      if (!texto) return true;

      const contenido = [
        item.epp_catalogo?.codigo,
        item.epp_catalogo?.nombre,
        item.epp_ubicaciones?.nombre,
        item.talla,
        item.lote,
        item.serial,
        item.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [
    inventario,
    busqueda,
    filtroUbicacion,
    filtroEpp,
    filtroTalla,
    filtroStock,
    umbralBajo,
  ]);

  const resumen = useMemo(() => {
    const totalDisponible = inventario.reduce(
      (total, item) => total + Number(item.cantidad_disponible || 0),
      0
    );

    const referencias = new Set(inventario.map((item) => item.epp_id)).size;

    const ubicacionesConStock = new Set(
      inventario
        .filter((item) => Number(item.cantidad_disponible || 0) > 0)
        .map((item) => item.ubicacion_id)
    ).size;

    const agotados = inventario.filter(
      (item) => Number(item.cantidad_disponible || 0) === 0
    ).length;

    const stockBajo = inventario.filter((item) => {
      const disponible = Number(item.cantidad_disponible || 0);
      return disponible > 0 && disponible <= umbralBajo;
    }).length;

    return {
      totalDisponible,
      referencias,
      ubicacionesConStock,
      agotados,
      stockBajo,
    };
  }, [inventario, umbralBajo]);

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroUbicacion("");
    setFiltroEpp("");
    setFiltroTalla("");
    setFiltroStock("TODOS");
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <a
              href="/control-trabajo/epp"
              className="text-sm text-neutral-600 hover:text-black"
            >
              ← Volver a Gestión de EPP
            </a>

            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Inventario de EPP
            </h1>

            <p className="mt-2 max-w-3xl text-neutral-600">
              Consulta de existencias por EPP, ubicación y talla.
            </p>
          </div>

          <a
            href="/control-trabajo/epp/entradas"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-5 py-3 font-bold text-white"
          >
            + Registrar entrada
          </a>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Indicador
            titulo="Unidades disponibles"
            valor={resumen.totalDisponible}
          />
          <Indicador
            titulo="Referencias"
            valor={resumen.referencias}
          />
          <Indicador
            titulo="Ubicaciones con stock"
            valor={resumen.ubicacionesConStock}
          />
          <Indicador
            titulo={`Stock bajo (≤ ${umbralBajo})`}
            valor={resumen.stockBajo}
          />
          <Indicador
            titulo="Combinaciones agotadas"
            valor={resumen.agotados}
          />
        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-2xl font-black">Filtros</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Puedes combinar varios filtros al mismo tiempo.
              </p>
            </div>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-sm font-bold hover:bg-neutral-50"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar código, EPP, ubicación, talla..."
              className="rounded-xl border border-neutral-300 px-4 py-3"
            />

            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className="rounded-xl border border-neutral-300 px-4 py-3"
            >
              <option value="">Todas las ubicaciones</option>
              {ubicaciones.map((ubicacion) => (
                <option key={ubicacion.id} value={ubicacion.id}>
                  {ubicacion.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroEpp}
              onChange={(e) => setFiltroEpp(e.target.value)}
              className="rounded-xl border border-neutral-300 px-4 py-3"
            >
              <option value="">Todos los EPP</option>
              {catalogo.map((epp) => (
                <option key={epp.id} value={epp.id}>
                  {epp.codigo} - {epp.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroTalla}
              onChange={(e) => setFiltroTalla(e.target.value)}
              className="rounded-xl border border-neutral-300 px-4 py-3"
            >
              <option value="">Todas las tallas</option>
              {tallas.map((talla) => (
                <option key={talla} value={talla}>
                  {talla}
                </option>
              ))}
            </select>

            <select
              value={filtroStock}
              onChange={(e) => setFiltroStock(e.target.value as FiltroStock)}
              className="rounded-xl border border-neutral-300 px-4 py-3"
            >
              <option value="TODOS">Cualquier nivel de stock</option>
              <option value="CON_STOCK">Con existencias</option>
              <option value="BAJO">Stock bajo</option>
              <option value="AGOTADO">Agotados</option>
            </select>

            <div className="flex items-center gap-3 rounded-xl border border-neutral-300 px-4 py-2">
              <label className="text-sm font-bold whitespace-nowrap">
                Umbral bajo:
              </label>
              <input
                type="number"
                min="1"
                value={umbralBajo}
                onChange={(e) =>
                  setUmbralBajo(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full border-0 bg-transparent py-1 outline-none"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-neutral-200 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Existencias</h2>
              <p className="mt-1 text-sm text-neutral-600">
                {inventarioFiltrado.length} de {inventario.length} registros
              </p>
            </div>

            <button
              type="button"
              onClick={cargarDatos}
              disabled={cargando}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              {cargando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            {cargando ? (
              <p className="py-10 text-center text-neutral-500">
                Cargando inventario...
              </p>
            ) : inventarioFiltrado.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-5xl">📦</div>
                <p className="mt-4 font-bold">
                  No hay registros que coincidan con los filtros
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[1050px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Código</th>
                    <th className="py-3 pr-4">EPP</th>
                    <th className="py-3 pr-4">Ubicación</th>
                    <th className="py-3 pr-4">Talla</th>
                    <th className="py-3 pr-4 text-right">Inicial</th>
                    <th className="py-3 pr-4 text-right">Disponible</th>
                    <th className="py-3 pr-4">Nivel</th>
                    <th className="py-3 pr-4">Lote</th>
                    <th className="py-3">Serial</th>
                  </tr>
                </thead>

                <tbody>
                  {inventarioFiltrado.map((item) => {
                    const disponible = Number(item.cantidad_disponible || 0);

                    let nivel = "Disponible";
                    let nivelClases =
                      "bg-green-100 text-green-700";

                    if (disponible === 0) {
                      nivel = "Agotado";
                      nivelClases = "bg-red-100 text-red-700";
                    } else if (disponible <= umbralBajo) {
                      nivel = "Stock bajo";
                      nivelClases = "bg-amber-100 text-amber-800";
                    }

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-4 pr-4 font-bold">
                          {item.epp_catalogo?.codigo ?? "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.epp_catalogo?.nombre ?? "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.epp_ubicaciones?.nombre ?? "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.talla || "No aplica"}
                        </td>

                        <td className="py-4 pr-4 text-right">
                          {item.cantidad_inicial}
                        </td>

                        <td className="py-4 pr-4 text-right text-base font-black">
                          {item.cantidad_disponible}
                        </td>

                        <td className="py-4 pr-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${nivelClases}`}
                          >
                            {nivel}
                          </span>
                        </td>

                        <td className="py-4 pr-4">
                          {item.lote || "—"}
                        </td>

                        <td className="py-4">
                          {item.serial || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Indicador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <p className="text-sm text-neutral-500">{titulo}</p>
      <p className="mt-1 text-3xl font-black">
        {valor.toLocaleString("es-CO")}
      </p>
    </div>
  );
}
