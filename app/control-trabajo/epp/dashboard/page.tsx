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

type AlertaDotacion = {
  trabajador_id: string;
  trabajador: string;
  identificacion: string;
cargo: string;
  epp_codigo: string;
  epp_nombre: string;
  cantidad_requerida: number;
  ultima_dotacion: string | null;
  proxima_dotacion: string | null;
  dias_restantes: number | null;
  estado: "SIN ENTREGA" | "VENCIDO" | "PRÓXIMO" | "VIGENTE";
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

export default function DashboardEPPPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [catalogo, setCatalogo] = useState<Catalogo[]>([]);
  const [reglas, setReglas] = useState<ReglaDotacion[]>([]);
  const [matrizCargo, setMatrizCargo] = useState<MatrizCargo[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [detalles, setDetalles] = useState<EntregaDetalle[]>([]);
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
      ]);

      if (trabajadoresResult.error) throw trabajadoresResult.error;
      if (catalogoResult.error) throw catalogoResult.error;
      if (reglasResult.error) throw reglasResult.error;
      if (matrizResult.error) throw matrizResult.error;
      if (entregasResult.error) throw entregasResult.error;
      if (detallesResult.error) throw detallesResult.error;

      setTrabajadores(trabajadoresResult.data || []);
      setCatalogo(catalogoResult.data || []);
      setReglas(reglasResult.data || []);
      setMatrizCargo(matrizResult.data || []);
      setEntregas(entregasResult.data || []);
      setDetalles(detallesResult.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No fue posible cargar el Dashboard EPP.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

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
      const cargoTrabajador = trabajador.cargo?.trim().toUpperCase();

      if (!cargoTrabajador) continue;

      const eppPermitidos = new Set(
        matrizCargo
          .filter(
            (item) =>
              item.activo &&
              item.cargo?.trim().toUpperCase() === cargoTrabajador
          )
          .map((item) => item.epp_id)
      );

      for (const regla of reglas) {
        if (!eppPermitidos.has(regla.epp_id)) {
          continue;
        }

        if (
          regla.cargo &&
          regla.cargo.trim().toUpperCase() !== cargoTrabajador
        ) {
          continue;
        }

        const epp = catalogoMap.get(regla.epp_id);

        if (!epp) continue;

        const entregasConEpp = entregasValidas.filter((entrega) => {
          if (entrega.trabajador_id !== trabajador.id) {
            return false;
          }

          return detalles.some(
            (detalle) =>
              detalle.entrega_id === entrega.id &&
              detalle.epp_id === regla.epp_id
          );
        });

        const ultimaEntrega = [...entregasConEpp].sort(
          (a, b) =>
            new Date(b.fecha_entrega).getTime() -
            new Date(a.fecha_entrega).getTime()
        )[0];

        let ultimaDotacion: string | null = null;
        let proximaDotacion: string | null = null;
        let diasRestantes: number | null = null;
        let estado: AlertaDotacion["estado"] = "SIN ENTREGA";

        if (ultimaEntrega) {
          ultimaDotacion = ultimaEntrega.fecha_entrega;

          const proximaFecha = sumarMeses(
            ultimaEntrega.fecha_entrega,
            regla.periodicidad_meses
          );

          proximaDotacion = proximaFecha.toISOString().slice(0, 10);
          diasRestantes = diferenciaDias(proximaFecha);

          if (diasRestantes < 0) {
            estado = "VENCIDO";
          } else if (diasRestantes <= 30) {
            estado = "PRÓXIMO";
          } else {
            estado = "VIGENTE";
          }
        }

      resultado.push({
  trabajador_id: trabajador.id,
  trabajador: `${trabajador.nombres} ${trabajador.apellidos}`,
  identificacion: trabajador.identificacion,
  cargo: trabajador.cargo || "",
  epp_codigo: epp.codigo,
  epp_nombre: epp.nombre,
  cantidad_requerida: regla.cantidad,
  ultima_dotacion: ultimaDotacion,
  proxima_dotacion: proximaDotacion,
  dias_restantes: diasRestantes,
  estado,
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
      vencidos: alertas.filter((item) => item.estado === "VENCIDO").length,
      proximos: alertas.filter((item) => item.estado === "PRÓXIMO").length,
      sinEntrega: alertas.filter((item) => item.estado === "SIN ENTREGA").length,
      vigentes: alertas.filter((item) => item.estado === "VIGENTE").length,
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
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));
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
      !filtroEstado || item.estado === filtroEstado;

    const coincideEpp =
      !filtroEpp || item.epp_codigo === filtroEpp;

    const coincideCargo =
      !filtroCargo || item.cargo === filtroCargo;

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

            <p className="mt-1 text-neutral-600">
              Seguimiento de dotaciones periódicas, vencimientos y próximas
              entregas.
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
            valor={resumen.trabajadoresConPendientes}
          />

          <Indicador
            titulo="Vigentes"
            valor={resumen.vigentes}
          />
        </div>

        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 p-5">
            <h2 className="text-xl font-black text-neutral-950">
              Control de dotaciones
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Solo las entregas confirmadas con motivo DOTACION reinician el
              ciclo periódico.
            </p>
          </div>

<div className="border-b border-neutral-200 bg-neutral-50 p-5">
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
    <input
      type="text"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      placeholder="Buscar trabajador o identificación..."
      className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-500"
    />

    <select
      value={filtroEstado}
      onChange={(e) => setFiltroEstado(e.target.value)}
      className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
    >
      <option value="">Todos los estados</option>
      <option value="SIN ENTREGA">Sin entrega</option>
      <option value="VENCIDO">Vencido</option>
      <option value="PRÓXIMO">Próximo</option>
      <option value="VIGENTE">Vigente</option>
    </select>

    <select
      value={filtroEpp}
      onChange={(e) => setFiltroEpp(e.target.value)}
      className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
    >
      <option value="">Todos los EPP</option>

      {opcionesEpp.map((item) => (
        <option key={item.codigo} value={item.codigo}>
          {item.codigo} - {item.nombre}
        </option>
      ))}
    </select>

    <select
      value={filtroCargo}
      onChange={(e) => setFiltroCargo(e.target.value)}
      className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
    >
      <option value="">Todos los cargos</option>

      {opcionesCargo.map((cargo) => (
        <option key={cargo} value={cargo}>
          {cargo}
        </option>
      ))}
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

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100 text-left text-neutral-700">
                <tr>
                  <th className="px-4 py-3">Trabajador</th>
                  <th className="px-4 py-3">Identificación</th>
                  <th className="px-4 py-3">EPP</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Última dotación</th>
                  <th className="px-4 py-3">Próxima dotación</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>

              <tbody>
                {alertasFiltradas.map((item) => (
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
                      {formatearFecha(item.ultima_dotacion)}
                    </td>

                    <td className="px-4 py-3">
                      {formatearFecha(item.proxima_dotacion)}
                    </td>

                    <td className="px-4 py-3">
                      <EstadoBadge
                        estado={item.estado}
                        dias={item.dias_restantes}
                      />
                    </td>
                  </tr>
                ))}

                {alertasFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-neutral-500"
                    >
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

function EstadoBadge({
  estado,
  dias,
}: {
  estado: AlertaDotacion["estado"];
  dias: number | null;
}) {
  const estilos = {
    VENCIDO: "bg-red-100 text-red-800",
    "SIN ENTREGA": "bg-neutral-200 text-neutral-800",
    PRÓXIMO: "bg-amber-100 text-amber-800",
    VIGENTE: "bg-green-100 text-green-800",
  };

  let texto = estado;

  if (estado === "PRÓXIMO" && dias !== null) {
    texto = `PRÓXIMO · ${dias} días`;
  }

  if (estado === "VENCIDO" && dias !== null) {
    texto = `VENCIDO · ${Math.abs(dias)} días`;
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${estilos[estado]}`}
    >
      {texto}
    </span>
  );
}