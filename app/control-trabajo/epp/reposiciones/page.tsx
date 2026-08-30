"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Trabajador = {
  id: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  cargo: string | null;
  base: string | null;
  talla_overol: string | null;
  talla_calzado: string | null;
  talla_guantes: string | null;
};

type Ubicacion = {
  id: string;
  nombre: string;
};

type Entrega = {
  id: string;
  trabajador_id: string;
  fecha_entrega: string;
  motivo: string | null;
  estado: string | null;
};

type DetalleEntrega = {
  id: string;
  entrega_id: string;
  epp_id: string;
  cantidad: number;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  epp_catalogo?: {
    codigo: string;
    nombre: string;
    categoria: string;
  } | null;
};

type EntregaDisponible = {
  detalle_id: string;
  entrega_id: string;
  epp_id: string;
  fecha_entrega: string;
  cantidad_original: number;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  codigo: string;
  nombre: string;
};

type Inventario = {
  id: string;
  epp_id: string;
  ubicacion_id: string;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  cantidad_disponible: number;
  estado: string;
  epp_catalogo?: {
    codigo: string;
    nombre: string;
  } | null;
};

type ReposicionBD = {
  id: string;
  trabajador_id: string;
  epp_id: string;
  entrega_original_id: string | null;
  ubicacion_id: string;
  fecha_solicitud: string;
  motivo: string;
  estado_epp_anterior: string | null;
  justificacion: string | null;
  estado: string;
  nueva_entrega_id: string | null;
  observaciones: string | null;
  created_at: string;

  epp_trabajadores?: {
    identificacion: string;
    nombres: string;
    apellidos: string;
  } | null;

  epp_catalogo?: {
    codigo: string;
    nombre: string;
  } | null;

  epp_ubicaciones?: {
    nombre: string;
  } | null;
};

type EntregaReposicion = {
  id: string;
  entregado_por: string | null;
};

type DetalleReposicion = {
  entrega_id: string;
  epp_id: string;
  cantidad: number;
  talla: string | null;
};

type HistorialReposicion = {
  id: string;
  fecha: string;
  trabajador_id: string;
  trabajador: string;
  identificacion: string;
  epp_id: string;
  codigo: string;
  epp: string;
  talla: string | null;
  cantidad: number;
  motivo: string;
  estado_epp_anterior: string | null;
  justificacion: string | null;
  responsable: string;
  ubicacion: string;
  estado: string;
  observaciones: string | null;
};

const motivosReposicion = [
  {
    value: "DAÑO_OPERACIONAL",
    label: "Daño operacional",
  },
  {
    value: "DETERIORO",
    label: "Deterioro",
  },
];

export default function ReposicionesEppPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);

  const [trabajadorId, setTrabajadorId] = useState("");
  const [busquedaTrabajador, setBusquedaTrabajador] = useState("");
  const [mostrarResultadosTrabajador, setMostrarResultadosTrabajador] =
    useState(false);

  const [entregasTrabajador, setEntregasTrabajador] = useState<
    EntregaDisponible[]
  >([]);

  const [entregaSeleccionadaId, setEntregaSeleccionadaId] = useState("");
  const [ubicacionId, setUbicacionId] = useState("");
  const [inventarioId, setInventarioId] = useState("");

  const [motivo, setMotivo] = useState("DETERIORO");
  const [estadoAnterior, setEstadoAnterior] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [entregadoPor, setEntregadoPor] = useState("");

  const [cantidad, setCantidad] = useState("1");

  const [fechaEntrega, setFechaEntrega] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [cargando, setCargando] = useState(true);
  const [cargandoEntregas, setCargandoEntregas] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // HISTORIAL
  // =========================================================

  const [historial, setHistorial] = useState<HistorialReposicion[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [errorHistorial, setErrorHistorial] = useState("");

  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [filtroMotivoHistorial, setFiltroMotivoHistorial] = useState("");
  const [filtroEppHistorial, setFiltroEppHistorial] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // =========================================================
  // CARGA PRINCIPAL
  // =========================================================

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [
      respuestaTrabajadores,
      respuestaUbicaciones,
      respuestaInventario,
    ] = await Promise.all([
      supabase
        .from("epp_trabajadores")
        .select(`
          id,
          identificacion,
          nombres,
          apellidos,
          cargo,
          base,
          talla_overol,
          talla_calzado,
          talla_guantes
        `)
        .eq("estado", "ACTIVO")
        .order("apellidos")
        .order("nombres"),

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
          cantidad_disponible,
          estado,
          epp_catalogo (
            codigo,
            nombre
          )
        `)
        .gt("cantidad_disponible", 0)
        .eq("estado", "DISPONIBLE"),
    ]);

    if (respuestaTrabajadores.error) {
      setError(
        `No fue posible consultar trabajadores: ${respuestaTrabajadores.error.message}`
      );
    } else {
      setTrabajadores(
        (respuestaTrabajadores.data ?? []) as Trabajador[]
      );
    }

    if (respuestaUbicaciones.error) {
      setError(
        `No fue posible consultar ubicaciones: ${respuestaUbicaciones.error.message}`
      );
    } else {
      setUbicaciones(
        (respuestaUbicaciones.data ?? []) as Ubicacion[]
      );
    }

    if (respuestaInventario.error) {
      setError(
        `No fue posible consultar inventario: ${respuestaInventario.error.message}`
      );
    } else {
      setInventario(
        (respuestaInventario.data ?? []) as unknown as Inventario[]
      );
    }

    setCargando(false);
  }

  // =========================================================
  // CARGAR HISTORIAL
  // =========================================================

  async function cargarHistorialReposiciones() {
    setCargandoHistorial(true);
    setErrorHistorial("");

    try {
      const { data: reposicionesData, error: reposicionesError } =
        await supabase
          .from("epp_reposiciones")
          .select(`
            id,
            trabajador_id,
            epp_id,
            entrega_original_id,
            ubicacion_id,
            fecha_solicitud,
            motivo,
            estado_epp_anterior,
            justificacion,
            estado,
            nueva_entrega_id,
            observaciones,
            created_at,
            epp_trabajadores (
              identificacion,
              nombres,
              apellidos
            ),
            epp_catalogo (
              codigo,
              nombre
            ),
            epp_ubicaciones (
              nombre
            )
          `)
          .order("created_at", { ascending: false });

      if (reposicionesError) {
        throw reposicionesError;
      }

      const reposiciones =
        (reposicionesData ?? []) as unknown as ReposicionBD[];

      if (reposiciones.length === 0) {
        setHistorial([]);
        setCargandoHistorial(false);
        return;
      }

      const nuevasEntregasIds = reposiciones
        .map((item) => item.nueva_entrega_id)
        .filter((id): id is string => Boolean(id));

      let entregasReposicion: EntregaReposicion[] = [];
      let detallesReposicion: DetalleReposicion[] = [];

      if (nuevasEntregasIds.length > 0) {
        const [respuestaEntregas, respuestaDetalles] =
          await Promise.all([
            supabase
              .from("epp_entregas")
              .select("id, entregado_por")
              .in("id", nuevasEntregasIds),

            supabase
              .from("epp_entrega_detalle")
              .select(`
                entrega_id,
                epp_id,
                cantidad,
                talla
              `)
              .in("entrega_id", nuevasEntregasIds),
          ]);

        if (respuestaEntregas.error) {
          throw respuestaEntregas.error;
        }

        if (respuestaDetalles.error) {
          throw respuestaDetalles.error;
        }

        entregasReposicion =
          (respuestaEntregas.data ?? []) as EntregaReposicion[];

        detallesReposicion =
          (respuestaDetalles.data ?? []) as DetalleReposicion[];
      }

      const entregasMap = new Map(
        entregasReposicion.map((item) => [item.id, item])
      );

      const historialProcesado: HistorialReposicion[] =
        reposiciones.map((reposicion) => {
          const entregaNueva = reposicion.nueva_entrega_id
            ? entregasMap.get(reposicion.nueva_entrega_id)
            : undefined;

          const detalle = detallesReposicion.find(
            (item) =>
              item.entrega_id === reposicion.nueva_entrega_id &&
              item.epp_id === reposicion.epp_id
          );

          return {
            id: reposicion.id,
            fecha: reposicion.fecha_solicitud,
            trabajador_id: reposicion.trabajador_id,

            trabajador: reposicion.epp_trabajadores
              ? `${reposicion.epp_trabajadores.nombres} ${reposicion.epp_trabajadores.apellidos}`
              : "Trabajador no disponible",

            identificacion:
              reposicion.epp_trabajadores?.identificacion || "—",

            epp_id: reposicion.epp_id,

            codigo:
              reposicion.epp_catalogo?.codigo || "—",

            epp:
              reposicion.epp_catalogo?.nombre || "EPP",

            talla: detalle?.talla || null,

            cantidad: detalle?.cantidad || 0,

            motivo: reposicion.motivo,

            estado_epp_anterior:
              reposicion.estado_epp_anterior,

            justificacion: reposicion.justificacion,

            responsable:
              entregaNueva?.entregado_por || "—",

            ubicacion:
              reposicion.epp_ubicaciones?.nombre || "—",

            estado: reposicion.estado,

            observaciones: reposicion.observaciones,
          };
        });

      setHistorial(historialProcesado);
    } catch (err: any) {
      console.error(err);

      setErrorHistorial(
        err?.message ||
          "No fue posible cargar el historial de reposiciones."
      );
    } finally {
      setCargandoHistorial(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    cargarHistorialReposiciones();
  }, []);

  // =========================================================
  // BUSCADOR DE TRABAJADORES
  // =========================================================

  const trabajadoresFiltrados = useMemo(() => {
    const texto = busquedaTrabajador.trim().toLowerCase();

    if (!texto) return [];

    return trabajadores
      .filter((trabajador) => {
        const contenido = [
          trabajador.identificacion,
          trabajador.nombres,
          trabajador.apellidos,
          `${trabajador.nombres} ${trabajador.apellidos}`,
          trabajador.cargo,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return contenido.includes(texto);
      })
      .slice(0, 10);
  }, [trabajadores, busquedaTrabajador]);

  const trabajadorSeleccionado = trabajadores.find(
    (trabajador) => trabajador.id === trabajadorId
  );

  const entregaSeleccionada = entregasTrabajador.find(
    (registro) =>
      registro.detalle_id === entregaSeleccionadaId
  );

  // =========================================================
  // INVENTARIO DISPONIBLE PARA REPOSICIÓN
  // =========================================================

  const inventarioDisponible = useMemo(() => {
    if (!entregaSeleccionada || !ubicacionId) return [];

    return inventario.filter(
      (registro) =>
        registro.epp_id === entregaSeleccionada.epp_id &&
        registro.ubicacion_id === ubicacionId &&
        registro.cantidad_disponible > 0 &&
        registro.estado === "DISPONIBLE"
    );
  }, [inventario, entregaSeleccionada, ubicacionId]);

  const inventarioSeleccionado = inventario.find(
    (registro) => registro.id === inventarioId
  );

  const cantidadNumero = Number(cantidad);

  const superaCantidadOriginal =
    entregaSeleccionada &&
    Number.isFinite(cantidadNumero) &&
    cantidadNumero > entregaSeleccionada.cantidad_original;

  // =========================================================
  // CARGAR ENTREGAS DEL TRABAJADOR
  // =========================================================

  async function cargarEntregasTrabajador(idTrabajador: string) {
    setCargandoEntregas(true);
    setError("");
    setEntregasTrabajador([]);

    const { data: entregas, error: errorEntregas } =
      await supabase
        .from("epp_entregas")
        .select(`
          id,
          trabajador_id,
          fecha_entrega,
          motivo,
          estado
        `)
        .eq("trabajador_id", idTrabajador)
        .eq("estado", "CONFIRMADA")
        .order("fecha_entrega", { ascending: false });

    if (errorEntregas) {
      setError(
        `No fue posible consultar las entregas anteriores: ${errorEntregas.message}`
      );

      setCargandoEntregas(false);
      return;
    }

    const entregasConfirmadas = (entregas ?? []) as Entrega[];

    if (entregasConfirmadas.length === 0) {
      setCargandoEntregas(false);
      return;
    }

    const idsEntregas = entregasConfirmadas.map(
      (entrega) => entrega.id
    );

    const { data: detalles, error: errorDetalles } =
      await supabase
        .from("epp_entrega_detalle")
        .select(`
          id,
          entrega_id,
          epp_id,
          cantidad,
          talla,
          lote,
          serial,
          epp_catalogo (
            codigo,
            nombre,
            categoria
          )
        `)
        .in("entrega_id", idsEntregas);

    if (errorDetalles) {
      setError(
        `No fue posible consultar los EPP entregados: ${errorDetalles.message}`
      );

      setCargandoEntregas(false);
      return;
    }

    const detallesEntrega =
      (detalles ?? []) as unknown as DetalleEntrega[];

    const registros: EntregaDisponible[] = [];

    for (const detalle of detallesEntrega) {
      const entrega = entregasConfirmadas.find(
        (registro) => registro.id === detalle.entrega_id
      );

      if (!entrega) continue;

      registros.push({
        detalle_id: detalle.id,
        entrega_id: detalle.entrega_id,
        epp_id: detalle.epp_id,
        fecha_entrega: entrega.fecha_entrega,
        cantidad_original: detalle.cantidad,
        talla: detalle.talla,
        lote: detalle.lote,
        serial: detalle.serial,
        codigo: detalle.epp_catalogo?.codigo || "",
        nombre: detalle.epp_catalogo?.nombre || "EPP",
      });
    }

    registros.sort(
      (a, b) =>
        new Date(b.fecha_entrega).getTime() -
        new Date(a.fecha_entrega).getTime()
    );

    setEntregasTrabajador(registros);
    setCargandoEntregas(false);
  }

  async function seleccionarTrabajador(trabajador: Trabajador) {
    setTrabajadorId(trabajador.id);

    setBusquedaTrabajador(
      `${trabajador.nombres} ${trabajador.apellidos} - ${trabajador.identificacion}`
    );

    setMostrarResultadosTrabajador(false);

    setEntregaSeleccionadaId("");
    setInventarioId("");
    setUbicacionId("");
    setCantidad("1");
    setMensaje("");
    setError("");

    await cargarEntregasTrabajador(trabajador.id);
  }

  // =========================================================
  // GUARDAR REPOSICIÓN
  // =========================================================

  async function guardarReposicion() {
    setMensaje("");
    setError("");

    if (!trabajadorId) {
      setError("Selecciona el trabajador.");
      return;
    }

    if (!entregaSeleccionada) {
      setError("Selecciona el EPP de la entrega original.");
      return;
    }

    if (!ubicacionId) {
      setError("Selecciona la ubicación de la reposición.");
      return;
    }

    if (!inventarioId) {
      setError("Selecciona el nuevo EPP del inventario.");
      return;
    }

    if (
      !Number.isInteger(cantidadNumero) ||
      cantidadNumero <= 0
    ) {
      setError(
        "La cantidad debe ser un número entero mayor que cero."
      );
      return;
    }

    if (
      inventarioSeleccionado &&
      cantidadNumero >
        inventarioSeleccionado.cantidad_disponible
    ) {
      setError(
        `Existencia insuficiente. Disponible: ${inventarioSeleccionado.cantidad_disponible}.`
      );
      return;
    }

    if (!fechaEntrega) {
      setError("Selecciona la fecha de reposición.");
      return;
    }

    if (!entregadoPor.trim()) {
      setError(
        "Debes indicar quién realiza la reposición."
      );
      return;
    }

    if (!justificacion.trim()) {
      setError(
        "Debes registrar la justificación de la reposición."
      );
      return;
    }

    setGuardando(true);

    const { data, error: errorRpc } = await supabase.rpc(
      "registrar_reposicion_epp",
      {
        p_trabajador_id: trabajadorId,
        p_epp_id: entregaSeleccionada.epp_id,

        p_entrega_original_id:
          entregaSeleccionada.entrega_id,

        p_inventario_id: inventarioId,
        p_ubicacion_id: ubicacionId,
        p_cantidad: cantidadNumero,
        p_motivo: motivo,

        p_estado_epp_anterior:
          estadoAnterior.trim() || null,

        p_justificacion: justificacion.trim(),
        p_entregado_por: entregadoPor.trim(),
        p_fecha_entrega: fechaEntrega,

        p_observaciones:
          observaciones.trim() || null,
      }
    );

    if (errorRpc) {
      console.error(errorRpc);

      setError(
        `No fue posible registrar la reposición: ${errorRpc.message}`
      );

      setGuardando(false);
      return;
    }

    setMensaje(
      `Reposición registrada correctamente. ID: ${data}`
    );

    setEntregaSeleccionadaId("");
    setInventarioId("");
    setCantidad("1");
    setEstadoAnterior("");
    setJustificacion("");
    setObservaciones("");

    await cargarDatos();
    await cargarEntregasTrabajador(trabajadorId);
    await cargarHistorialReposiciones();

    setGuardando(false);
  }

  // =========================================================
  // HISTORIAL - OPCIONES
  // =========================================================

  const opcionesEppHistorial = useMemo(() => {
    return Array.from(
      new Map(
        historial.map((item) => [
          item.epp_id,
          {
            id: item.epp_id,
            codigo: item.codigo,
            nombre: item.epp,
          },
        ])
      ).values()
    ).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [historial]);

  // =========================================================
  // HISTORIAL - FILTROS
  // =========================================================

  const historialFiltrado = useMemo(() => {
    const texto = busquedaHistorial.trim().toUpperCase();

    return historial.filter((item) => {
      const coincideBusqueda =
        !texto ||
        item.trabajador.toUpperCase().includes(texto) ||
        item.identificacion.toUpperCase().includes(texto) ||
        item.codigo.toUpperCase().includes(texto) ||
        item.epp.toUpperCase().includes(texto);

      const coincideMotivo =
        !filtroMotivoHistorial ||
        item.motivo === filtroMotivoHistorial;

      const coincideEpp =
        !filtroEppHistorial ||
        item.epp_id === filtroEppHistorial;

      const coincideFechaDesde =
        !fechaDesde ||
        item.fecha >= fechaDesde;

      const coincideFechaHasta =
        !fechaHasta ||
        item.fecha <= fechaHasta;

      return (
        coincideBusqueda &&
        coincideMotivo &&
        coincideEpp &&
        coincideFechaDesde &&
        coincideFechaHasta
      );
    });
  }, [
    historial,
    busquedaHistorial,
    filtroMotivoHistorial,
    filtroEppHistorial,
    fechaDesde,
    fechaHasta,
  ]);

  // =========================================================
  // HISTORIAL - INDICADORES
  // =========================================================

  const resumenHistorial = useMemo(() => {
    return {
      total: historialFiltrado.length,

      deterioro: historialFiltrado.filter(
        (item) => item.motivo === "DETERIORO"
      ).length,

      danoOperacional: historialFiltrado.filter(
        (item) => item.motivo === "DAÑO_OPERACIONAL"
      ).length,

      unidades: historialFiltrado.reduce(
        (acumulado, item) =>
          acumulado + Number(item.cantidad || 0),
        0
      ),
    };
  }, [historialFiltrado]);

  function limpiarFiltrosHistorial() {
    setBusquedaHistorial("");
    setFiltroMotivoHistorial("");
    setFiltroEppHistorial("");
    setFechaDesde("");
    setFechaHasta("");
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

        {/* ===================================================
            ENCABEZADO
        =================================================== */}

        <header>
          <a
            href="/control-trabajo/epp"
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a Gestión de EPP
          </a>

          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
            Reposición de EPP
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-600">
            Reposición inmediata de elementos por daño operacional
            o deterioro, manteniendo la trazabilidad de la entrega
            original.
          </p>
        </header>

        {cargando ? (
          <div className="rounded-3xl border border-neutral-200 p-10 text-center">
            Cargando información...
          </div>
        ) : (
          <>

            {/* =================================================
                1. TRABAJADOR
            ================================================= */}

            <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-black">
                1. Trabajador
              </h2>

              <div className="relative mt-6">
                <Etiqueta texto="Trabajador *" />

                <input
                  type="search"
                  value={busquedaTrabajador}
                  onChange={(e) => {
                    setBusquedaTrabajador(e.target.value);
                    setMostrarResultadosTrabajador(true);

                    if (trabajadorId) {
                      setTrabajadorId("");
                      setEntregasTrabajador([]);
                      setEntregaSeleccionadaId("");
                      setInventarioId("");
                    }
                  }}
                  onFocus={() =>
                    setMostrarResultadosTrabajador(true)
                  }
                  placeholder="Buscar por nombre, apellido o cédula..."
                  autoComplete="off"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                />

                {mostrarResultadosTrabajador && (
                  <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl">

                    {trabajadoresFiltrados.length > 0 ? (
                      trabajadoresFiltrados.map(
                        (trabajador) => (
                          <button
                            key={trabajador.id}
                            type="button"
                            onClick={() =>
                              seleccionarTrabajador(trabajador)
                            }
                            className="block w-full border-b border-neutral-100 px-4 py-3 text-left last:border-b-0 hover:bg-neutral-50"
                          >
                            <div className="font-bold">
                              {trabajador.nombres}{" "}
                              {trabajador.apellidos}
                            </div>

                            <div className="mt-1 text-sm text-neutral-500">
                              CC {trabajador.identificacion}

                              {trabajador.cargo
                                ? ` · ${trabajador.cargo}`
                                : ""}
                            </div>
                          </button>
                        )
                      )
                    ) : (
                      <div className="px-4 py-4 text-sm text-neutral-500">
                        No se encontraron trabajadores.
                      </div>
                    )}

                  </div>
                )}
              </div>

              {trabajadorSeleccionado && (
                <div className="mt-6 rounded-2xl bg-neutral-50 p-5">

                  <div className="font-black">
                    {trabajadorSeleccionado.nombres}{" "}
                    {trabajadorSeleccionado.apellidos}
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">

                    <Dato
                      titulo="Cargo"
                      valor={
                        trabajadorSeleccionado.cargo || "—"
                      }
                    />

                    <Dato
                      titulo="Base"
                      valor={
                        trabajadorSeleccionado.base || "—"
                      }
                    />

                    <Dato
                      titulo="Calzado"
                      valor={
                        trabajadorSeleccionado.talla_calzado ||
                        "—"
                      }
                    />

                    <Dato
                      titulo="Overol"
                      valor={
                        trabajadorSeleccionado.talla_overol ||
                        "—"
                      }
                    />

                    <Dato
                      titulo="Guantes"
                      valor={
                        trabajadorSeleccionado.talla_guantes ||
                        "—"
                      }
                    />

                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                2. EPP A REPONER
            ================================================= */}

            <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

              <h2 className="text-2xl font-black">
                2. EPP a reponer
              </h2>

              {!trabajadorId ? (
                <Aviso>
                  Selecciona primero el trabajador.
                </Aviso>
              ) : cargandoEntregas ? (
                <Aviso>
                  Consultando entregas anteriores...
                </Aviso>
              ) : entregasTrabajador.length === 0 ? (
                <Aviso>
                  Este trabajador no tiene entregas confirmadas
                  registradas.
                </Aviso>
              ) : (
                <div className="mt-6">

                  <Etiqueta texto="Entrega original / EPP *" />

                  <select
                    value={entregaSeleccionadaId}
                    onChange={(e) => {
                      setEntregaSeleccionadaId(e.target.value);
                      setInventarioId("");
                      setCantidad("1");
                    }}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  >
                    <option value="">
                      Seleccionar EPP entregado...
                    </option>

                    {entregasTrabajador.map((registro) => (
                      <option
                        key={registro.detalle_id}
                        value={registro.detalle_id}
                      >
                        {formatearFecha(registro.fecha_entrega)}
                        {" | "}
                        {registro.codigo} - {registro.nombre}
                        {" | "}
                        Cantidad entregada:{" "}
                        {registro.cantidad_original}

                        {registro.talla
                          ? ` | Talla ${registro.talla}`
                          : ""}
                      </option>
                    ))}
                  </select>

                </div>
              )}

              {entregaSeleccionada && (
                <div className="mt-5 rounded-2xl bg-neutral-50 p-5">

                  <div className="text-xs font-bold uppercase text-neutral-500">
                    Entrega original
                  </div>

                  <div className="mt-2 text-lg font-black">
                    {entregaSeleccionada.codigo} -{" "}
                    {entregaSeleccionada.nombre}
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

                    <Dato
                      titulo="Fecha"
                      valor={formatearFecha(
                        entregaSeleccionada.fecha_entrega
                      )}
                    />

                    <Dato
                      titulo="Cantidad original"
                      valor={String(
                        entregaSeleccionada.cantidad_original
                      )}
                    />

                    <Dato
                      titulo="Talla"
                      valor={
                        entregaSeleccionada.talla ||
                        "No aplica"
                      }
                    />

                    <Dato
                      titulo="Lote"
                      valor={
                        entregaSeleccionada.lote || "—"
                      }
                    />

                  </div>
                </div>
              )}

            </section>

            {/* =================================================
                3. DATOS DE REPOSICIÓN
            ================================================= */}

            {entregaSeleccionada && (
              <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

                <h2 className="text-2xl font-black">
                  3. Datos de la reposición
                </h2>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>
                    <Etiqueta texto="Motivo *" />

                    <select
                      value={motivo}
                      onChange={(e) =>
                        setMotivo(e.target.value)
                      }
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                    >
                      {motivosReposicion.map((opcion) => (
                        <option
                          key={opcion.value}
                          value={opcion.value}
                        >
                          {opcion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Etiqueta texto="Fecha de reposición *" />

                    <input
                      type="date"
                      value={fechaEntrega}
                      onChange={(e) =>
                        setFechaEntrega(e.target.value)
                      }
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <Etiqueta texto="Ubicación *" />

                    <select
                      value={ubicacionId}
                      onChange={(e) => {
                        setUbicacionId(e.target.value);
                        setInventarioId("");
                      }}
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                    >
                      <option value="">
                        Seleccionar ubicación...
                      </option>

                      {ubicaciones.map((ubicacion) => (
                        <option
                          key={ubicacion.id}
                          value={ubicacion.id}
                        >
                          {ubicacion.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Etiqueta texto="Entregado por *" />

                    <input
                      value={entregadoPor}
                      onChange={(e) =>
                        setEntregadoPor(e.target.value)
                      }
                      placeholder="Responsable de la reposición"
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Etiqueta texto="Estado del EPP anterior" />

                    <input
                      value={estadoAnterior}
                      onChange={(e) =>
                        setEstadoAnterior(e.target.value)
                      }
                      placeholder="Ej.: roto, desgastado, costura deteriorada..."
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Etiqueta texto="Justificación *" />

                    <textarea
                      value={justificacion}
                      onChange={(e) =>
                        setJustificacion(e.target.value)
                      }
                      rows={3}
                      placeholder="Describe por qué se requiere la reposición..."
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                    />
                  </div>

                </div>
              </section>
            )}

            {/* =================================================
                4. EPP DE REEMPLAZO
            ================================================= */}

            {entregaSeleccionada && ubicacionId && (
              <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

                <h2 className="text-2xl font-black">
                  4. EPP de reemplazo
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  Solo se muestran existencias del mismo EPP que
                  se está reemplazando.
                </p>

                {inventarioDisponible.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    No existe disponibilidad de este EPP en la
                    ubicación seleccionada.
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-5">

                    <div>
                      <Etiqueta texto="Inventario disponible *" />

                      <select
                        value={inventarioId}
                        onChange={(e) =>
                          setInventarioId(e.target.value)
                        }
                        className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                      >
                        <option value="">
                          Seleccionar existencia...
                        </option>

                        {inventarioDisponible.map(
                          (registro) => (
                            <option
                              key={registro.id}
                              value={registro.id}
                            >
                              {registro.epp_catalogo?.codigo} -{" "}
                              {registro.epp_catalogo?.nombre}

                              {registro.talla
                                ? ` | Talla ${registro.talla}`
                                : ""}

                              {registro.lote
                                ? ` | Lote ${registro.lote}`
                                : ""}

                              {registro.serial
                                ? ` | Serial ${registro.serial}`
                                : ""}

                              {` | Disponible: ${registro.cantidad_disponible}`}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <Etiqueta texto="Cantidad *" />

                      <input
                        type="number"
                        min="1"
                        max={
                          inventarioSeleccionado
                            ?.cantidad_disponible
                        }
                        value={cantidad}
                        onChange={(e) =>
                          setCantidad(e.target.value)
                        }
                        className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                      />
                    </div>

                  </div>
                )}

                {superaCantidadOriginal && (
                  <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5">

                    <div className="font-black text-amber-900">
                      ⚠ La cantidad supera la entrega original
                    </div>

                    <p className="mt-1 text-sm text-amber-800">
                      La entrega original fue de{" "}
                      <strong>
                        {entregaSeleccionada.cantidad_original}
                      </strong>{" "}
                      unidad(es) y se están solicitando{" "}
                      <strong>{cantidadNumero}</strong>.
                      La reposición puede continuar por necesidad
                      operacional, pero debe quedar debidamente
                      justificada.
                    </p>

                  </div>
                )}

              </section>
            )}

            {/* =================================================
                5. CONFIRMACIÓN
            ================================================= */}

            {entregaSeleccionada && (
              <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

                <h2 className="text-2xl font-black">
                  5. Confirmación
                </h2>

                <div className="mt-6">
                  <Etiqueta texto="Observaciones" />

                  <textarea
                    value={observaciones}
                    onChange={(e) =>
                      setObservaciones(e.target.value)
                    }
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <button
                  type="button"
                  onClick={guardarReposicion}
                  disabled={
                    guardando ||
                    !inventarioId ||
                    !justificacion.trim()
                  }
                  className="mt-6 w-full rounded-xl bg-neutral-950 py-4 text-lg font-black text-white disabled:opacity-40"
                >
                  {guardando
                    ? "Registrando reposición..."
                    : "Confirmar reposición de EPP"}
                </button>

                {mensaje && (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {mensaje}
                  </div>
                )}

                {error && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

              </section>
            )}

            {/* =================================================
                6. HISTORIAL DE REPOSICIONES
            ================================================= */}

            <section className="rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">

              <div className="p-6 md:p-8 border-b border-neutral-200">

                <div className="flex flex-wrap items-start justify-between gap-4">

                  <div>
                    <h2 className="text-2xl font-black">
                      6. Historial de reposiciones
                    </h2>

                    <p className="mt-2 text-neutral-600">
                      Consulta y análisis de los EPP repuestos por
                      daño operacional o deterioro.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={cargarHistorialReposiciones}
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-3 font-bold hover:bg-neutral-50"
                  >
                    Actualizar historial
                  </button>

                </div>
              </div>

              {/* INDICADORES */}

              <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4 bg-neutral-50">

                <IndicadorHistorial
                  titulo="Total reposiciones"
                  valor={resumenHistorial.total}
                />

                <IndicadorHistorial
                  titulo="Deterioro"
                  valor={resumenHistorial.deterioro}
                />

                <IndicadorHistorial
                  titulo="Daño operacional"
                  valor={resumenHistorial.danoOperacional}
                />

                <IndicadorHistorial
                  titulo="Unidades repuestas"
                  valor={resumenHistorial.unidades}
                />

              </div>

              {/* FILTROS */}

              <div className="border-y border-neutral-200 p-6">

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">

                  <input
                    type="search"
                    value={busquedaHistorial}
                    onChange={(e) =>
                      setBusquedaHistorial(e.target.value)
                    }
                    placeholder="Trabajador, cédula o EPP..."
                    className="rounded-xl border border-neutral-300 px-4 py-3"
                  />

                  <select
                    value={filtroMotivoHistorial}
                    onChange={(e) =>
                      setFiltroMotivoHistorial(e.target.value)
                    }
                    className="rounded-xl border border-neutral-300 px-4 py-3"
                  >
                    <option value="">
                      Todos los motivos
                    </option>

                    <option value="DETERIORO">
                      Deterioro
                    </option>

                    <option value="DAÑO_OPERACIONAL">
                      Daño operacional
                    </option>
                  </select>

                  <select
                    value={filtroEppHistorial}
                    onChange={(e) =>
                      setFiltroEppHistorial(e.target.value)
                    }
                    className="rounded-xl border border-neutral-300 px-4 py-3"
                  >
                    <option value="">
                      Todos los EPP
                    </option>

                    {opcionesEppHistorial.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.codigo} - {item.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) =>
                      setFechaDesde(e.target.value)
                    }
                    title="Fecha desde"
                    className="rounded-xl border border-neutral-300 px-4 py-3"
                  />

                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) =>
                      setFechaHasta(e.target.value)
                    }
                    title="Fecha hasta"
                    className="rounded-xl border border-neutral-300 px-4 py-3"
                  />

                  <button
                    type="button"
                    onClick={limpiarFiltrosHistorial}
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-3 font-bold hover:bg-neutral-50"
                  >
                    Limpiar filtros
                  </button>

                </div>

                <div className="mt-4 text-sm text-neutral-500">
                  Mostrando{" "}
                  <strong className="text-neutral-950">
                    {historialFiltrado.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-neutral-950">
                    {historial.length}
                  </strong>{" "}
                  reposiciones
                </div>

              </div>

              {/* CONTENIDO HISTORIAL */}

              {cargandoHistorial ? (
                <div className="p-10 text-center text-neutral-500">
                  Cargando historial de reposiciones...
                </div>
              ) : errorHistorial ? (
                <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {errorHistorial}
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="min-w-[1400px] w-full text-sm">

                    <thead className="bg-neutral-100 text-left text-neutral-700">
                      <tr>
                        <th className="px-4 py-3">
                          Fecha
                        </th>

                        <th className="px-4 py-3">
                          Trabajador
                        </th>

                        <th className="px-4 py-3">
                          Identificación
                        </th>

                        <th className="px-4 py-3">
                          EPP
                        </th>

                        <th className="px-4 py-3">
                          Talla
                        </th>

                        <th className="px-4 py-3">
                          Cant.
                        </th>

                        <th className="px-4 py-3">
                          Motivo
                        </th>

                        <th className="px-4 py-3">
                          Estado anterior
                        </th>

                        <th className="px-4 py-3">
                          Ubicación
                        </th>

                        <th className="px-4 py-3">
                          Responsable
                        </th>

                        <th className="px-4 py-3">
                          Estado
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {historialFiltrado.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-neutral-100 align-top"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            {formatearFecha(item.fecha)}
                          </td>

                          <td className="px-4 py-4 font-semibold">
                            {item.trabajador}
                          </td>

                          <td className="px-4 py-4 text-neutral-600">
                            {item.identificacion}
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-semibold">
                              {item.epp}
                            </div>

                            <div className="mt-1 text-xs text-neutral-500">
                              {item.codigo}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {item.talla || "No aplica"}
                          </td>

                          <td className="px-4 py-4 font-black">
                            {item.cantidad}
                          </td>

                          <td className="px-4 py-4">
                            <MotivoBadge motivo={item.motivo} />
                          </td>

                          <td className="px-4 py-4 max-w-[220px]">
                            {item.estado_epp_anterior || "—"}
                          </td>

                          <td className="px-4 py-4">
                            {item.ubicacion}
                          </td>

                          <td className="px-4 py-4">
                            {item.responsable}
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                              {item.estado}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {historialFiltrado.length === 0 && (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-4 py-12 text-center text-neutral-500"
                          >
                            No se encontraron reposiciones con los
                            filtros seleccionados.
                          </td>
                        </tr>
                      )}

                    </tbody>
                  </table>

                </div>
              )}

            </section>

          </>
        )}

      </div>
    </main>
  );
}

// =============================================================
// COMPONENTES
// =============================================================

function Etiqueta({
  texto,
}: {
  texto: string;
}) {
  return (
    <label className="mb-2 block text-sm font-bold">
      {texto}
    </label>
  );
}

function Dato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div>
      <div className="text-xs text-neutral-500">
        {titulo}
      </div>

      <div className="mt-1 font-semibold">
        {valor}
      </div>
    </div>
  );
}

function Aviso({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-2xl bg-yellow-50 p-5 text-sm text-yellow-800">
      {children}
    </div>
  );
}

function IndicadorHistorial({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

      <div className="text-sm font-semibold text-neutral-500">
        {titulo}
      </div>

      <div className="mt-2 text-3xl font-black text-neutral-950">
        {valor.toLocaleString("es-CO")}
      </div>

    </div>
  );
}

function MotivoBadge({
  motivo,
}: {
  motivo: string;
}) {
  if (motivo === "DETERIORO") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
        DETERIORO
      </span>
    );
  }

  if (motivo === "DAÑO_OPERACIONAL") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
        DAÑO OPERACIONAL
      </span>
    );
  }

  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-neutral-200 px-3 py-1 text-xs font-bold text-neutral-800">
      {formatearMotivo(motivo)}
    </span>
  );
}

function formatearMotivo(motivo: string) {
  return motivo
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function formatearFecha(fecha: string) {
  if (!fecha) return "—";

  const partes = fecha.substring(0, 10).split("-");

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}