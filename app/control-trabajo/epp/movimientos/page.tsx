"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Movimiento = {
  id: string;
  inventario_id: string;
  tipo_movimiento: string;
  cantidad: number;
  ubicacion_origen_id: string | null;
  ubicacion_destino_id: string | null;
  entrega_id: string | null;
  trabajador_id: string | null;
  motivo: string | null;
  documento_referencia: string | null;
  realizado_por: string;
  fecha_movimiento: string;
};

type Inventario = {
  id: string;
  epp_id: string;
  ubicacion_id: string;
  talla: string | null;
  lote: string | null;
  serial: string | null;
};

type Epp = {
  id: string;
  codigo: string;
  nombre: string;
};

type Ubicacion = {
  id: string;
  nombre: string;
};

type Trabajador = {
  id: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
};

export default function MovimientosEppPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [catalogo, setCatalogo] = useState<Epp[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [filtroEpp, setFiltroEpp] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [
      respuestaMovimientos,
      respuestaInventario,
      respuestaCatalogo,
      respuestaUbicaciones,
      respuestaTrabajadores,
    ] = await Promise.all([
      supabase
        .from("epp_movimientos")
        .select(`
          id,
          inventario_id,
          tipo_movimiento,
          cantidad,
          ubicacion_origen_id,
          ubicacion_destino_id,
          entrega_id,
          trabajador_id,
          motivo,
          documento_referencia,
          realizado_por,
          fecha_movimiento
        `)
        .order("fecha_movimiento", { ascending: false }),

      supabase
        .from("epp_inventario")
        .select("id,epp_id,ubicacion_id,talla,lote,serial"),

      supabase
        .from("epp_catalogo")
        .select("id,codigo,nombre")
        .order("codigo"),

      supabase
        .from("epp_ubicaciones")
        .select("id,nombre")
        .order("nombre"),

      supabase
        .from("epp_trabajadores")
        .select("id,identificacion,nombres,apellidos")
        .order("apellidos"),
    ]);

    if (respuestaMovimientos.error) {
      console.error(respuestaMovimientos.error);
      setError(
        `No fue posible consultar los movimientos: ${respuestaMovimientos.error.message}`
      );
    } else {
      setMovimientos(
        (respuestaMovimientos.data ?? []) as unknown as Movimiento[]
      );
    }

    if (!respuestaInventario.error) {
      setInventario(
        (respuestaInventario.data ?? []) as unknown as Inventario[]
      );
    }

    if (!respuestaCatalogo.error) {
      setCatalogo((respuestaCatalogo.data ?? []) as unknown as Epp[]);
    }

    if (!respuestaUbicaciones.error) {
      setUbicaciones(
        (respuestaUbicaciones.data ?? []) as unknown as Ubicacion[]
      );
    }

    if (!respuestaTrabajadores.error) {
      setTrabajadores(
        (respuestaTrabajadores.data ?? []) as unknown as Trabajador[]
      );
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const inventarioPorId = useMemo(
    () => new Map(inventario.map((item) => [item.id, item])),
    [inventario]
  );

  const eppPorId = useMemo(
    () => new Map(catalogo.map((item) => [item.id, item])),
    [catalogo]
  );

  const ubicacionPorId = useMemo(
    () => new Map(ubicaciones.map((item) => [item.id, item])),
    [ubicaciones]
  );

  const trabajadorPorId = useMemo(
    () => new Map(trabajadores.map((item) => [item.id, item])),
    [trabajadores]
  );

  const tiposMovimiento = useMemo(() => {
    return Array.from(
      new Set(movimientos.map((item) => item.tipo_movimiento).filter(Boolean))
    ).sort();
  }, [movimientos]);

  const movimientosEnriquecidos = useMemo(() => {
    return movimientos.map((movimiento) => {
      const inv = inventarioPorId.get(movimiento.inventario_id);
      const epp = inv ? eppPorId.get(inv.epp_id) : undefined;

      const ubicacionOrigen = movimiento.ubicacion_origen_id
        ? ubicacionPorId.get(movimiento.ubicacion_origen_id)
        : undefined;

      const ubicacionDestino = movimiento.ubicacion_destino_id
        ? ubicacionPorId.get(movimiento.ubicacion_destino_id)
        : undefined;

      const trabajador = movimiento.trabajador_id
        ? trabajadorPorId.get(movimiento.trabajador_id)
        : undefined;

      return {
        ...movimiento,
        inventario: inv,
        epp,
        ubicacionOrigen,
        ubicacionDestino,
        trabajador,
      };
    });
  }, [
    movimientos,
    inventarioPorId,
    eppPorId,
    ubicacionPorId,
    trabajadorPorId,
  ]);

  const movimientosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return movimientosEnriquecidos.filter((item) => {
      if (filtroTipo && item.tipo_movimiento !== filtroTipo) return false;

      if (
        filtroUbicacion &&
        item.ubicacion_origen_id !== filtroUbicacion &&
        item.ubicacion_destino_id !== filtroUbicacion &&
        item.inventario?.ubicacion_id !== filtroUbicacion
      ) {
        return false;
      }

      if (filtroEpp && item.inventario?.epp_id !== filtroEpp) return false;

      if (fechaDesde) {
        const fechaMovimiento = new Date(item.fecha_movimiento);
        const desde = new Date(`${fechaDesde}T00:00:00`);
        if (fechaMovimiento < desde) return false;
      }

      if (fechaHasta) {
        const fechaMovimiento = new Date(item.fecha_movimiento);
        const hasta = new Date(`${fechaHasta}T23:59:59`);
        if (fechaMovimiento > hasta) return false;
      }

      if (!texto) return true;

      const trabajadorNombre = item.trabajador
        ? `${item.trabajador.nombres} ${item.trabajador.apellidos}`
        : "";

      const contenido = [
        item.epp?.codigo,
        item.epp?.nombre,
        item.inventario?.talla,
        item.inventario?.lote,
        item.inventario?.serial,
        item.ubicacionOrigen?.nombre,
        item.ubicacionDestino?.nombre,
        trabajadorNombre,
        item.trabajador?.identificacion,
        item.tipo_movimiento,
        item.documento_referencia,
        item.realizado_por,
        item.motivo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [
    movimientosEnriquecidos,
    busqueda,
    filtroTipo,
    filtroUbicacion,
    filtroEpp,
    fechaDesde,
    fechaHasta,
  ]);

  const resumen = useMemo(() => {
    let entradas = 0;
    let salidas = 0;

   for (const item of movimientosEnriquecidos) {
  const cantidad = Number(item.cantidad || 0);

  if (item.tipo_movimiento === "ENTRADA") {
    entradas += cantidad;
  }

  if (item.tipo_movimiento === "ENTREGA") {
    salidas += cantidad;
  }
}

    return {
      movimientos: movimientosEnriquecidos.length,
      entradas,
      salidas,
    };
  }, [movimientosEnriquecidos]);

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroTipo("");
    setFiltroUbicacion("");
    setFiltroEpp("");
    setFechaDesde("");
    setFechaHasta("");
  }

  function fechaHora(valor: string) {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(valor));
  }

  function nombreTrabajador(
    trabajador: { nombres: string; apellidos: string } | undefined
  ) {
    if (!trabajador) return "—";
    return `${trabajador.nombres} ${trabajador.apellidos}`.trim();
  }

  function nombreUbicacion(
    origen: { nombre: string } | undefined,
    destino: { nombre: string } | undefined,
    tipo: string
  ) {
    if (tipo === "ENTRADA") return destino?.nombre ?? "—";

    if (origen && destino) {
      return `${origen.nombre} → ${destino.nombre}`;
    }

    return origen?.nombre ?? destino?.nombre ?? "—";
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
              Kardex de EPP
            </h1>

            <p className="mt-2 max-w-3xl text-neutral-600">
              Historial de entradas, entregas y demás movimientos del inventario
              de elementos de protección personal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/control-trabajo/epp/inventario"
              className="rounded-xl border border-neutral-300 px-5 py-3 font-bold hover:bg-neutral-50"
            >
              Ver inventario
            </a>

            <a
              href="/control-trabajo/epp/entradas"
              className="rounded-xl bg-neutral-950 px-5 py-3 font-bold text-white"
            >
              + Registrar entrada
            </a>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Indicador titulo="Movimientos" valor={resumen.movimientos} />
          <Indicador titulo="Unidades de entrada" valor={resumen.entradas} />
          <Indicador titulo="Unidades de salida" valor={resumen.salidas} />
        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-2xl font-black">Filtros</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Consulta movimientos por producto, ubicación, tipo o periodo.
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
              placeholder="Buscar EPP, trabajador, documento..."
              className="rounded-xl border border-neutral-300 px-4 py-3"
            />

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="rounded-xl border border-neutral-300 px-4 py-3"
            >
              <option value="">Todos los movimientos</option>
              {tiposMovimiento.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

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

            <div>
              <label className="mb-2 block text-sm font-bold">Fecha desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">Fecha hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3"
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
              <h2 className="text-2xl font-black">Movimientos</h2>
              <p className="mt-1 text-sm text-neutral-600">
                {movimientosFiltrados.length} de {movimientos.length} registros
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
                Cargando movimientos...
              </p>
            ) : movimientosFiltrados.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-5xl">📋</div>
                <p className="mt-4 font-bold">
                  No hay movimientos que coincidan con los filtros
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[1450px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Fecha</th>
                    <th className="py-3 pr-4">Tipo</th>
                    <th className="py-3 pr-4">Código</th>
                    <th className="py-3 pr-4">EPP</th>
                    <th className="py-3 pr-4">Talla</th>
                    <th className="py-3 pr-4">Ubicación</th>
                    <th className="py-3 pr-4 text-right">Cantidad</th>
                    <th className="py-3 pr-4">Trabajador</th>
                    <th className="py-3 pr-4">Documento</th>
                    <th className="py-3 pr-4">Responsable</th>
                    <th className="py-3 pr-4">Lote</th>
                    <th className="py-3 pr-4">Serial</th>
                    <th className="py-3">Motivo</th>
                  </tr>
                </thead>

                <tbody>
                  {movimientosFiltrados.map((item) => {
                    const entrada = item.tipo_movimiento === "ENTRADA";

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-4 pr-4 whitespace-nowrap">
                          {fechaHora(item.fecha_movimiento)}
                        </td>

                        <td className="py-4 pr-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              entrada
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.tipo_movimiento}
                          </span>
                        </td>

                        <td className="py-4 pr-4 font-bold">
                          {item.epp?.codigo ?? "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.epp?.nombre ?? "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.inventario?.talla || "No aplica"}
                        </td>

                        <td className="py-4 pr-4">
                          {nombreUbicacion(
                            item.ubicacionOrigen,
                            item.ubicacionDestino,
                            item.tipo_movimiento
                          )}
                        </td>

                        <td className="py-4 pr-4 text-right text-base font-black">
                          {item.cantidad}
                        </td>

                        <td className="py-4 pr-4">
                          {nombreTrabajador(item.trabajador)}
                        </td>

                        <td className="py-4 pr-4">
                          {item.documento_referencia || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.realizado_por || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.inventario?.lote || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.inventario?.serial || "—"}
                        </td>

                        <td className="py-4">
                          {item.motivo || "—"}
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