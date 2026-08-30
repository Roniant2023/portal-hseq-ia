"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Trabajador = {
  id: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  cargo: string | null;
  estado: string;
};

type Catalogo = {
  id: string;
  codigo: string;
  nombre: string;
};

type ReglaDotacion = {
  id: string;
  epp_id: string;
  cargo: string | null;
  cantidad: number;
  periodicidad_meses: number;
  permite_reposicion: boolean;
  activo: boolean;
};

type MatrizCargo = {
  cargo: string;
  epp_id: string;
  activo: boolean;
};

type Entrega = {
  id: string;
  trabajador_id: string;
  fecha_entrega: string;
  motivo: string | null;
  estado: string | null;
};

type EntregaDetalle = {
  entrega_id: string;
  epp_id: string;
  cantidad: number;
};

type Ubicacion = {
  id: string;
  nombre: string;
};

type Reposicion = {
  id: string;
  trabajador_id: string;
  epp_id: string;
  ubicacion_id: string;
  fecha_solicitud: string;
  motivo: string;
  estado: string;
  nueva_entrega_id: string | null;
};

type AlertaDotacion = {
  trabajador_id: string;
  trabajador: string;
  identificacion: string;
  cargo: string;
  epp_id: string;
  epp_codigo: string;
  epp_nombre: string;
  cantidad_requerida: number;
  ultima_dotacion: string | null;
  proxima_dotacion: string | null;
  dias_restantes: number | null;
  estado: "SIN ENTREGA" | "VENCIDO" | "PRÓXIMO" | "VIGENTE";

  cantidad_reposiciones: number;
  ultima_reposicion: string | null;
  ultimo_motivo_reposicion: string | null;
};
type BarraDato = {
  nombre: string;
  valor: number;
  detalle?: string;
};

type ReposicionProcesada = {
  id: string;
  trabajador_id: string;
  trabajador: string;
  identificacion: string;
  epp_id: string;
  epp_codigo: string;
  epp_nombre: string;
  ubicacion_id: string;
  ubicacion: string;
  fecha: string;
  motivo: string;
  estado: string;
  cantidad: number;
};

function sumarMeses(fecha: string, meses: number) {
  const nuevaFecha = new Date(`${fecha}T00:00:00`);
  nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
  return nuevaFecha;
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin registro";

  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function diferenciaDias(fechaObjetivo: Date) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const objetivo = new Date(fechaObjetivo);
  objetivo.setHours(0, 0, 0, 0);

  const diferencia = objetivo.getTime() - hoy.getTime();

  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

function formatearMotivo(motivo: string) {
  return motivo
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function etiquetaMes(fecha: string) {
  const fechaLocal = new Date(`${fecha}T00:00:00`);

  return fechaLocal.toLocaleDateString("es-CO", {
    month: "short",
    year: "numeric",
  });
}

export default function DashboardEPPPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [catalogo, setCatalogo] = useState<Catalogo[]>([]);
  const [reglas, setReglas] = useState<ReglaDotacion[]>([]);
  const [matrizCargo, setMatrizCargo] = useState<MatrizCargo[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [detalles, setDetalles] = useState<EntregaDetalle[]>([]);

  const [reposiciones, setReposiciones] = useState<Reposicion[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroEpp, setFiltroEpp] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [
        trabajadoresResult,
        catalogoResult,
        reglasResult,
        matrizResult,
        entregasResult,
        detallesResult,
        reposicionesResult,
        ubicacionesResult,
      ] = await Promise.all([
        supabase
          .from("epp_trabajadores")
          .select("id, identificacion, nombres, apellidos, cargo, estado")
          .eq("estado", "ACTIVO"),

        supabase
          .from("epp_catalogo")
          .select("id, codigo, nombre"),

        supabase
          .from("epp_reglas_dotacion")
          .select(
            "id, epp_id, cargo, cantidad, periodicidad_meses, permite_reposicion, activo"
          )
          .eq("activo", true),

        supabase
          .from("epp_matriz_cargo")
          .select("cargo, epp_id, activo")
          .eq("activo", true),

        supabase
          .from("epp_entregas")
          .select("id, trabajador_id, fecha_entrega, motivo, estado"),

        supabase
          .from("epp_entrega_detalle")
          .select("entrega_id, epp_id, cantidad"),

        supabase
          .from("epp_reposiciones")
          .select(`
            id,
            trabajador_id,
            epp_id,
            ubicacion_id,
            fecha_solicitud,
            motivo,
            estado,
            nueva_entrega_id
          `),

        supabase
          .from("epp_ubicaciones")
          .select("id, nombre"),
      ]);

      if (trabajadoresResult.error) throw trabajadoresResult.error;
      if (catalogoResult.error) throw catalogoResult.error;
      if (reglasResult.error) throw reglasResult.error;
      if (matrizResult.error) throw matrizResult.error;
      if (entregasResult.error) throw entregasResult.error;
      if (detallesResult.error) throw detallesResult.error;
      if (reposicionesResult.error) throw reposicionesResult.error;
      if (ubicacionesResult.error) throw ubicacionesResult.error;

      setTrabajadores(trabajadoresResult.data || []);
      setCatalogo(catalogoResult.data || []);
      setReglas(reglasResult.data || []);
      setMatrizCargo(matrizResult.data || []);
      setEntregas(entregasResult.data || []);
      setDetalles(detallesResult.data || []);
      setReposiciones(reposicionesResult.data || []);
      setUbicaciones(ubicacionesResult.data || []);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "No fue posible cargar el Dashboard EPP."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // =========================================================
  // CONTROL DE DOTACIONES PERIÓDICAS
  // =========================================================

  const alertas = useMemo<AlertaDotacion[]>(() => {
    const catalogoMap = new Map(
      catalogo.map((item) => [item.id, item])
    );

    const entregasValidas = entregas.filter(
      (entrega) =>
        entrega.estado?.trim().toUpperCase() === "CONFIRMADA" &&
        entrega.motivo?.trim().toUpperCase() === "DOTACION"
    );

    const resultado: AlertaDotacion[] = [];

    for (const trabajador of trabajadores) {
      const cargoTrabajador =
        trabajador.cargo?.trim().toUpperCase();

      if (!cargoTrabajador) continue;

      const eppPermitidos = new Set(
        matrizCargo
          .filter(
            (item) =>
              item.activo &&
              item.cargo?.trim().toUpperCase() ===
                cargoTrabajador
          )
          .map((item) => item.epp_id)
      );

      for (const regla of reglas) {
        if (!eppPermitidos.has(regla.epp_id)) {
          continue;
        }

        if (
          regla.cargo &&
          regla.cargo.trim().toUpperCase() !==
            cargoTrabajador
        ) {
          continue;
        }

        const epp = catalogoMap.get(regla.epp_id);

        if (!epp) continue;

        const entregasConEpp = entregasValidas.filter(
          (entrega) => {
            if (
              entrega.trabajador_id !== trabajador.id
            ) {
              return false;
            }

            return detalles.some(
              (detalle) =>
                detalle.entrega_id === entrega.id &&
                detalle.epp_id === regla.epp_id
            );
          }
        );

        const ultimaEntrega = [...entregasConEpp].sort(
          (a, b) =>
            new Date(b.fecha_entrega).getTime() -
            new Date(a.fecha_entrega).getTime()
        )[0];

        let ultimaDotacion: string | null = null;
        let proximaDotacion: string | null = null;
        let diasRestantes: number | null = null;

        let estado: AlertaDotacion["estado"] =
          "SIN ENTREGA";

        if (ultimaEntrega) {
          ultimaDotacion = ultimaEntrega.fecha_entrega;

          const proximaFecha = sumarMeses(
            ultimaEntrega.fecha_entrega,
            regla.periodicidad_meses
          );

          proximaDotacion =
            proximaFecha.toISOString().slice(0, 10);

          diasRestantes =
            diferenciaDias(proximaFecha);

          if (diasRestantes < 0) {
            estado = "VENCIDO";
          } else if (diasRestantes <= 30) {
            estado = "PRÓXIMO";
          } else {
            estado = "VIGENTE";
          }
        }
const reposicionesDelEpp = reposiciones
  .filter(
    (reposicion) =>
      reposicion.trabajador_id === trabajador.id &&
      reposicion.epp_id === regla.epp_id &&
      ["ENTREGADA", "CERRADA"].includes(
        reposicion.estado?.trim().toUpperCase()
      )
  )
  .sort(
    (a, b) =>
      new Date(b.fecha_solicitud).getTime() -
      new Date(a.fecha_solicitud).getTime()
  );

const ultimaReposicion =
  reposicionesDelEpp[0] ?? null;
        resultado.push({
  trabajador_id: trabajador.id,
  trabajador: `${trabajador.nombres} ${trabajador.apellidos}`,
  identificacion: trabajador.identificacion,
  cargo: trabajador.cargo || "",

  epp_id: regla.epp_id,
  epp_codigo: epp.codigo,
  epp_nombre: epp.nombre,

  cantidad_requerida: regla.cantidad,
  ultima_dotacion: ultimaDotacion,
  proxima_dotacion: proximaDotacion,
  dias_restantes: diasRestantes,
  estado,

  cantidad_reposiciones: reposicionesDelEpp.length,
  ultima_reposicion:
    ultimaReposicion?.fecha_solicitud ?? null,
  ultimo_motivo_reposicion:
    ultimaReposicion?.motivo ?? null,
});
      }
    }

    return resultado.sort((a, b) => {
      const orden = {
        VENCIDO: 1,
        "SIN ENTREGA": 2,
        PRÓXIMO: 3,
        VIGENTE: 4,
      };

      return orden[a.estado] - orden[b.estado];
    });
  }, [
  trabajadores,
  catalogo,
  reglas,
  matrizCargo,
  entregas,
  detalles,
  reposiciones,
]);

  const resumen = useMemo(() => {
    const trabajadoresConPendientes = new Set(
      alertas
        .filter(
          (item) =>
            item.estado === "SIN ENTREGA" ||
            item.estado === "VENCIDO" ||
            item.estado === "PRÓXIMO"
        )
        .map((item) => item.trabajador_id)
    ).size;

    return {
      trabajadores: trabajadores.length,
      reglas: reglas.length,

      vencidos: alertas.filter(
        (item) => item.estado === "VENCIDO"
      ).length,

      proximos: alertas.filter(
        (item) => item.estado === "PRÓXIMO"
      ).length,

      sinEntrega: alertas.filter(
        (item) => item.estado === "SIN ENTREGA"
      ).length,

      vigentes: alertas.filter(
        (item) => item.estado === "VIGENTE"
      ).length,

      trabajadoresConPendientes,
    };
  }, [trabajadores, reglas, alertas]);

  const opcionesEpp = useMemo(() => {
    return Array.from(
      new Map(
        alertas.map((item) => [
          item.epp_codigo,
          {
            codigo: item.epp_codigo,
            nombre: item.epp_nombre,
          },
        ])
      ).values()
    ).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [alertas]);

  const opcionesCargo = useMemo(() => {
    return Array.from(
      new Set(
        alertas
          .map((item) => item.cargo)
          .filter((cargo) => cargo.trim() !== "")
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [alertas]);

  const alertasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toUpperCase();

    return alertas.filter((item) => {
      const coincideBusqueda =
        !texto ||
        item.trabajador.toUpperCase().includes(texto) ||
        item.identificacion.toUpperCase().includes(texto);

      const coincideEstado =
        !filtroEstado ||
        item.estado === filtroEstado;

      const coincideEpp =
        !filtroEpp ||
        item.epp_codigo === filtroEpp;

      const coincideCargo =
        !filtroCargo ||
        item.cargo === filtroCargo;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideEpp &&
        coincideCargo
      );
    });
  }, [
    alertas,
    busqueda,
    filtroEstado,
    filtroEpp,
    filtroCargo,
  ]);

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("");
    setFiltroEpp("");
    setFiltroCargo("");
  }

  // =========================================================
  // ANALÍTICA DE REPOSICIONES
  // =========================================================

  const reposicionesProcesadas =
    useMemo<ReposicionProcesada[]>(() => {
      const trabajadorMap = new Map(
        trabajadores.map((item) => [
          item.id,
          item,
        ])
      );

      const catalogoMap = new Map(
        catalogo.map((item) => [
          item.id,
          item,
        ])
      );

      const ubicacionMap = new Map(
        ubicaciones.map((item) => [
          item.id,
          item,
        ])
      );

      return reposiciones
        .filter((reposicion) =>
          ["ENTREGADA", "CERRADA"].includes(
            reposicion.estado
              ?.trim()
              .toUpperCase()
          )
        )
        .map((reposicion) => {
          const trabajador =
            trabajadorMap.get(
              reposicion.trabajador_id
            );

          const epp =
            catalogoMap.get(reposicion.epp_id);

          const ubicacion =
            ubicacionMap.get(
              reposicion.ubicacion_id
            );

          const cantidad = reposicion.nueva_entrega_id
            ? detalles
                .filter(
                  (detalle) =>
                    detalle.entrega_id ===
                      reposicion.nueva_entrega_id &&
                    detalle.epp_id ===
                      reposicion.epp_id
                )
                .reduce(
                  (total, detalle) =>
                    total +
                    Number(detalle.cantidad || 0),
                  0
                )
            : 0;

          return {
            id: reposicion.id,

            trabajador_id:
              reposicion.trabajador_id,

            trabajador: trabajador
              ? `${trabajador.nombres} ${trabajador.apellidos}`
              : "Sin información",

            identificacion:
              trabajador?.identificacion || "—",

            epp_id: reposicion.epp_id,
            epp_codigo: epp?.codigo || "—",
            epp_nombre:
              epp?.nombre || "EPP",

            ubicacion_id:
              reposicion.ubicacion_id,

            ubicacion:
              ubicacion?.nombre ||
              "Sin ubicación",

            fecha:
              reposicion.fecha_solicitud,

            motivo: reposicion.motivo,
            estado: reposicion.estado,
            cantidad,
          };
        });
    }, [
      reposiciones,
      trabajadores,
      catalogo,
      ubicaciones,
      detalles,
    ]);

  const analitica = useMemo(() => {
    const unidadesRepuestas =
      reposicionesProcesadas.reduce(
        (total, item) =>
          total + item.cantidad,
        0
      );

    // -----------------------------------------
    // POR MOTIVO
    // -----------------------------------------

    const motivosMap = new Map<string, number>();

    for (const item of reposicionesProcesadas) {
      motivosMap.set(
        item.motivo,
        (motivosMap.get(item.motivo) || 0) +
          item.cantidad
      );
    }

    const porMotivo: BarraDato[] =
      Array.from(motivosMap.entries())
        .map(([nombre, valor]) => ({
          nombre: formatearMotivo(nombre),
          valor,
        }))
        .sort((a, b) => b.valor - a.valor);

    // -----------------------------------------
    // POR EPP
    // -----------------------------------------

    const eppMap = new Map<
      string,
      {
        nombre: string;
        codigo: string;
        valor: number;
      }
    >();

    for (const item of reposicionesProcesadas) {
      const actual = eppMap.get(item.epp_id);

      if (actual) {
        actual.valor += item.cantidad;
      } else {
        eppMap.set(item.epp_id, {
          nombre: item.epp_nombre,
          codigo: item.epp_codigo,
          valor: item.cantidad,
        });
      }
    }

    const porEpp: BarraDato[] =
      Array.from(eppMap.values())
        .map((item) => ({
          nombre: item.nombre,
          detalle: item.codigo,
          valor: item.valor,
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8);

    // -----------------------------------------
    // POR UBICACIÓN
    // -----------------------------------------

    const ubicacionMap = new Map<
      string,
      number
    >();

    for (const item of reposicionesProcesadas) {
      ubicacionMap.set(
        item.ubicacion,
        (ubicacionMap.get(item.ubicacion) ||
          0) + item.cantidad
      );
    }

    const porUbicacion: BarraDato[] =
      Array.from(ubicacionMap.entries())
        .map(([nombre, valor]) => ({
          nombre,
          valor,
        }))
        .sort((a, b) => b.valor - a.valor);

    // -----------------------------------------
    // POR TRABAJADOR
    // -----------------------------------------

    const trabajadorMap = new Map<
      string,
      {
        nombre: string;
        identificacion: string;
        valor: number;
      }
    >();

    for (const item of reposicionesProcesadas) {
      const actual = trabajadorMap.get(
        item.trabajador_id
      );

      if (actual) {
        actual.valor += item.cantidad;
      } else {
        trabajadorMap.set(
          item.trabajador_id,
          {
            nombre: item.trabajador,
            identificacion:
              item.identificacion,
            valor: item.cantidad,
          }
        );
      }
    }

    const trabajadoresOrdenados =
      Array.from(
        trabajadorMap.values()
      ).sort(
        (a, b) => b.valor - a.valor
      );

    const trabajadorMayor =
      trabajadoresOrdenados[0];

    // -----------------------------------------
    // TENDENCIA MENSUAL
    // -----------------------------------------

    const mesesMap = new Map<
      string,
      {
        clave: string;
        nombre: string;
        valor: number;
      }
    >();

    for (const item of reposicionesProcesadas) {
      const clave = item.fecha.slice(0, 7);

      const actual =
        mesesMap.get(clave);

      if (actual) {
        actual.valor += item.cantidad;
      } else {
        mesesMap.set(clave, {
          clave,
          nombre: etiquetaMes(
            `${clave}-01`
          ),
          valor: item.cantidad,
        });
      }
    }

    const tendenciaMensual =
      Array.from(mesesMap.values())
        .sort((a, b) =>
          a.clave.localeCompare(b.clave)
        )
        .map((item) => ({
          nombre: item.nombre,
          valor: item.valor,
        }));

    const eppMayor =
      porEpp[0];

    const ubicacionMayor =
      porUbicacion[0];

    return {
      totalReposiciones:
        reposicionesProcesadas.length,

      unidadesRepuestas,

      eppMayor:
        eppMayor?.nombre || "Sin datos",

      eppMayorCantidad:
        eppMayor?.valor || 0,

      ubicacionMayor:
        ubicacionMayor?.nombre ||
        "Sin datos",

      ubicacionMayorCantidad:
        ubicacionMayor?.valor || 0,

      trabajadorMayor:
        trabajadorMayor?.nombre ||
        "Sin datos",

      trabajadorMayorCantidad:
        trabajadorMayor?.valor || 0,

      porMotivo,
      porEpp,
      porUbicacion,
      tendenciaMensual,
    };
  }, [reposicionesProcesadas]);

  // =========================================================
  // CONSUMO DOTACIÓN VS REPOSICIÓN
  // =========================================================

  const consumoTipo = useMemo(() => {
    let dotacion = 0;
    let reposicion = 0;

    const entregasMap = new Map(
      entregas.map((entrega) => [
        entrega.id,
        entrega,
      ])
    );

    for (const detalle of detalles) {
      const entrega =
        entregasMap.get(
          detalle.entrega_id
        );

      if (
        !entrega ||
        entrega.estado
          ?.trim()
          .toUpperCase() !==
          "CONFIRMADA"
      ) {
        continue;
      }

      const motivo =
        entrega.motivo
          ?.trim()
          .toUpperCase();

      if (motivo === "DOTACION") {
        dotacion += Number(
          detalle.cantidad || 0
        );
      }

      if (motivo === "REPOSICION") {
        reposicion += Number(
          detalle.cantidad || 0
        );
      }
    }

    return [
      {
        nombre: "Dotación programada",
        valor: dotacion,
      },
      {
        nombre: "Reposición extraordinaria",
        valor: reposicion,
      },
    ];
  }, [entregas, detalles]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-neutral-600">
            Cargando Dashboard EPP...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ===================================================
            ENCABEZADO
        =================================================== */}

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>
            <a
              href="/control-trabajo/epp"
              className="text-sm text-neutral-600 hover:text-black"
            >
              ← Volver a Gestión de EPP
            </a>

            <h1 className="mt-2 text-3xl font-black text-neutral-950">
              Dashboard EPP
            </h1>

            <p className="mt-1 max-w-3xl text-neutral-600">
              Seguimiento de dotaciones periódicas,
              vencimientos, consumo y reposiciones de
              elementos de protección personal.
            </p>
          </div>

          <button
            onClick={cargarDatos}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 font-semibold hover:bg-neutral-100"
          >
            Actualizar
          </button>

        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
            INDICADORES DE DOTACIÓN
        =================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">

          <Indicador
            titulo="Trabajadores activos"
            valor={resumen.trabajadores}
          />

          <Indicador
            titulo="Reglas activas"
            valor={resumen.reglas}
          />

          <Indicador
            titulo="Vencidos"
            valor={resumen.vencidos}
          />

          <Indicador
            titulo="Próximos ≤30 días"
            valor={resumen.proximos}
          />

          <Indicador
            titulo="Dotaciones sin registro"
            valor={resumen.sinEntrega}
          />

          <Indicador
            titulo="Trabajadores con pendientes"
            valor={
              resumen.trabajadoresConPendientes
            }
          />

          <Indicador
            titulo="Vigentes"
            valor={resumen.vigentes}
          />

        </div>

        {/* ===================================================
            CONTROL DE DOTACIONES
        =================================================== */}

        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">

          <div className="border-b border-neutral-200 p-5">

            <h2 className="text-xl font-black text-neutral-950">
              Control de dotaciones
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Solo las entregas confirmadas con motivo
              DOTACION reinician el ciclo periódico.
            </p>

          </div>

          {/* FILTROS */}

          <div className="border-b border-neutral-200 bg-neutral-50 p-5">

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">

              <input
                type="text"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Buscar trabajador o identificación..."
                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-500"
              />

              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(
                    e.target.value
                  )
                }
                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
              >
                <option value="">
                  Todos los estados
                </option>

                <option value="SIN ENTREGA">
                  Sin entrega
                </option>

                <option value="VENCIDO">
                  Vencido
                </option>

                <option value="PRÓXIMO">
                  Próximo
                </option>

                <option value="VIGENTE">
                  Vigente
                </option>
              </select>

              <select
                value={filtroEpp}
                onChange={(e) =>
                  setFiltroEpp(
                    e.target.value
                  )
                }
                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
              >
                <option value="">
                  Todos los EPP
                </option>

                {opcionesEpp.map(
                  (item) => (
                    <option
                      key={item.codigo}
                      value={item.codigo}
                    >
                      {item.codigo} -{" "}
                      {item.nombre}
                    </option>
                  )
                )}
              </select>

              <select
                value={filtroCargo}
                onChange={(e) =>
                  setFiltroCargo(
                    e.target.value
                  )
                }
                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
              >
                <option value="">
                  Todos los cargos
                </option>

                {opcionesCargo.map(
                  (cargo) => (
                    <option
                      key={cargo}
                      value={cargo}
                    >
                      {cargo}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 font-semibold text-neutral-800 hover:bg-neutral-100"
              >
                Limpiar filtros
              </button>

            </div>

            <div className="mt-3 text-sm text-neutral-500">
              Mostrando{" "}
              <span className="font-bold text-neutral-900">
                {alertasFiltradas.length}
              </span>{" "}
              de{" "}
              <span className="font-bold text-neutral-900">
                {alertas.length}
              </span>{" "}
              registros
            </div>

          </div>

          {/* TABLA */}

          <div className="overflow-x-auto">

            <table className="min-w-full text-sm">

              <thead className="bg-neutral-100 text-left text-neutral-700">
                <tr>
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
                    Cantidad
                  </th>

                  <th className="px-4 py-3">
                    Última dotación
                  </th>

                  <th className="px-4 py-3">
  Próxima dotación
</th>

<th className="px-4 py-3">
  Reposiciones
</th>

<th className="px-4 py-3">
  Estado
</th>
                </tr>
              </thead>

              <tbody>

                {alertasFiltradas.map(
                  (item) => (
                    <tr
                      key={`${item.trabajador_id}-${item.epp_codigo}`}
                      className="border-t border-neutral-100"
                    >
                      <td className="px-4 py-3 font-semibold text-neutral-950">
                        {item.trabajador}
                      </td>

                      <td className="px-4 py-3 text-neutral-600">
                        {item.identificacion}
                      </td>

                      <td className="px-4 py-3">

                        <div className="font-semibold">
                          {item.epp_nombre}
                        </div>

                        <div className="text-xs text-neutral-500">
                          {item.epp_codigo}
                        </div>

                      </td>

                      <td className="px-4 py-3">
                        {item.cantidad_requerida}
                      </td>

                      <td className="px-4 py-3">
                        {formatearFecha(
                          item.ultima_dotacion
                        )}
                      </td>

                     <td className="px-4 py-3">
  {formatearFecha(
    item.proxima_dotacion
  )}
</td>

<td className="px-4 py-3">
  {item.cantidad_reposiciones > 0 ? (
    <div>
      <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
        {item.cantidad_reposiciones}{" "}
        {item.cantidad_reposiciones === 1
          ? "reposición"
          : "reposiciones"}
      </span>

      {item.ultimo_motivo_reposicion && (
        <div className="mt-1 text-xs font-semibold text-amber-800">
          Última:{" "}
          {formatearMotivo(
            item.ultimo_motivo_reposicion
          )}
        </div>
      )}

      {item.ultima_reposicion && (
        <div className="mt-1 text-xs text-neutral-500">
          {formatearFecha(
            item.ultima_reposicion
          )}
        </div>
      )}
    </div>
  ) : (
    <span className="text-neutral-400">
      —
    </span>
  )}
</td>

<td className="px-4 py-3">
  <EstadoBadge
    estado={item.estado}
    dias={
      item.dias_restantes
    }
  />
</td>
                    </tr>
                  )
                )}

                {alertasFiltradas.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-neutral-500"
                    >
                      No se encontraron
                      registros con los
                      filtros seleccionados.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ===================================================
            ANALÍTICA DE CONSUMO
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

          <div className="border-b border-neutral-200 p-6">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>
                <h2 className="text-2xl font-black text-neutral-950">
                  Análisis de consumo y reposiciones
                </h2>

                <p className="mt-1 max-w-3xl text-sm text-neutral-500">
                  Identificación de patrones de consumo
                  extraordinario para detectar EPP,
                  ubicaciones o causas que puedan requerir
                  acciones de intervención.
                </p>
              </div>

              <div className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600">
                Datos en tiempo real
              </div>

            </div>

          </div>

          {/* INDICADORES ANALÍTICOS */}

          <div className="grid gap-4 bg-neutral-50 p-6 sm:grid-cols-2 xl:grid-cols-4">

            <Indicador
              titulo="Reposiciones atendidas"
              valor={
                analitica.totalReposiciones
              }
            />

            <Indicador
              titulo="Unidades repuestas"
              valor={
                analitica.unidadesRepuestas
              }
            />

            <IndicadorTexto
              titulo="EPP con mayor reposición"
              valor={
                analitica.eppMayor
              }
              subtitulo={`${analitica.eppMayorCantidad} unidad(es)`}
            />

            <IndicadorTexto
              titulo="Ubicación con mayor reposición"
              valor={
                analitica.ubicacionMayor
              }
              subtitulo={`${analitica.ubicacionMayorCantidad} unidad(es)`}
            />

          </div>

          {/* GRÁFICAS */}

          <div className="grid gap-6 p-6 xl:grid-cols-2">

            <GraficaBarras
              titulo="EPP con mayor reposición"
              descripcion="Unidades repuestas por tipo de EPP."
              datos={
                analitica.porEpp
              }
              vacio="Aún no existen suficientes reposiciones para mostrar esta gráfica."
            />

            <GraficaBarras
              titulo="Reposiciones por motivo"
              descripcion="Causas que originan consumo extraordinario de EPP."
              datos={
                analitica.porMotivo
              }
              vacio="Aún no existen reposiciones clasificadas por motivo."
            />

            <GraficaBarras
              titulo="Reposiciones por ubicación"
              descripcion="Permite identificar bases o patios con mayor consumo extraordinario."
              datos={
                analitica.porUbicacion
              }
              vacio="Aún no existen datos por ubicación."
            />

            <GraficaBarras
              titulo="Evolución mensual de reposiciones"
              descripcion="Unidades repuestas a través del tiempo."
              datos={
                analitica.tendenciaMensual
              }
              vacio="Se requiere información histórica para mostrar la tendencia."
            />

          </div>

          {/* CONSUMO PROGRAMADO VS EXTRAORDINARIO */}

          <div className="border-t border-neutral-200 p-6">

            <GraficaBarras
              titulo="Dotación programada vs. reposición extraordinaria"
              descripcion="Compara las unidades entregadas como dotación normal frente al consumo generado por reposiciones."
              datos={consumoTipo}
              vacio="Todavía no existen entregas suficientes para realizar la comparación."
            />

          </div>

          {/* ALERTA DE GESTIÓN */}

          {analitica.totalReposiciones >
            0 && (
            <div className="border-t border-neutral-200 bg-neutral-950 p-6 text-white">

              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Lectura para gestión
              </div>

              <div className="mt-2 text-lg font-black">
                Mayor concentración actual
              </div>

              <p className="mt-2 max-w-4xl text-sm text-neutral-300">

                El EPP con mayor número de
                unidades repuestas es{" "}
                <strong className="text-white">
                  {analitica.eppMayor}
                </strong>
                , mientras que la ubicación
                con mayor consumo
                extraordinario es{" "}
                <strong className="text-white">
                  {
                    analitica
                      .ubicacionMayor
                  }
                </strong>
                .

                {" "}

                Estos indicadores deben
                interpretarse como señales
                para profundizar en las causas,
                frecuencia de uso, condiciones
                operativas, calidad del elemento
                y comportamiento del consumo.

              </p>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

// =============================================================
// COMPONENTES
// =============================================================

function Indicador({
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

function IndicadorTexto({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  subtitulo?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

      <div className="text-sm font-semibold text-neutral-500">
        {titulo}
      </div>

      <div className="mt-2 line-clamp-2 text-lg font-black text-neutral-950">
        {valor}
      </div>

      {subtitulo && (
        <div className="mt-2 text-sm text-neutral-500">
          {subtitulo}
        </div>
      )}

    </div>
  );
}

function EstadoBadge({
  estado,
  dias,
}: {
  estado: AlertaDotacion["estado"];
  dias: number | null;
}) {
  const estilos = {
    VENCIDO:
      "bg-red-100 text-red-800",

    "SIN ENTREGA":
      "bg-neutral-200 text-neutral-800",

    PRÓXIMO:
      "bg-amber-100 text-amber-800",

    VIGENTE:
      "bg-green-100 text-green-800",
  };

  let texto: string = estado;

  if (
    estado === "PRÓXIMO" &&
    dias !== null
  ) {
    texto = `PRÓXIMO · ${dias} días`;
  }

  if (
    estado === "VENCIDO" &&
    dias !== null
  ) {
    texto = `VENCIDO · ${Math.abs(
      dias
    )} días`;
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${estilos[estado]}`}
    >
      {texto}
    </span>
  );
}

function GraficaBarras({
  titulo,
  descripcion,
  datos,
  vacio,
}: {
  titulo: string;
  descripcion: string;
  datos: BarraDato[];
  vacio: string;
}) {
  const maximo = Math.max(
    ...datos.map(
      (item) => item.valor
    ),
    1
  );

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">

      <div>
        <h3 className="text-lg font-black text-neutral-950">
          {titulo}
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          {descripcion}
        </p>
      </div>

      {datos.length === 0 ? (
        <div className="mt-6 rounded-xl bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {vacio}
        </div>
      ) : (
        <div className="mt-6 space-y-5">

          {datos.map(
            (item, index) => {
              const porcentaje =
                Math.max(
                  4,
                  (item.valor / maximo) *
                    100
                );

              return (
                <div
                  key={`${titulo}-${item.nombre}-${index}`}
                >

                  <div className="mb-2 flex items-end justify-between gap-4">

                    <div className="min-w-0">

                      <div className="truncate text-sm font-bold text-neutral-900">
                        {item.nombre}
                      </div>

                      {item.detalle && (
                        <div className="text-xs text-neutral-500">
                          {item.detalle}
                        </div>
                      )}

                    </div>

                    <div className="shrink-0 text-sm font-black text-neutral-950">
                      {item.valor.toLocaleString(
                        "es-CO"
                      )}
                    </div>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-neutral-100">

                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all"
                      style={{
                        width: `${porcentaje}%`,
                      }}
                    />

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}