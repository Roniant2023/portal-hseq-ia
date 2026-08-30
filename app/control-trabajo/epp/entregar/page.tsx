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
  talla_pantalon: string | null;
  talla_calzado: string | null;
  talla_guantes: string | null;
};

type Ubicacion = {
  id: string;
  nombre: string;
};

type MatrizCargo = {
  cargo: string;
  epp_id: string;
  obligatorio: boolean;
  cantidad_requerida: number;
  activo: boolean;
};

type Inventario = {
  id: string;
  epp_id: string;
  ubicacion_id: string;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  fecha_vencimiento: string | null;
  cantidad_disponible: number;
  estado: string;

  epp_catalogo?: {
    codigo: string;
    nombre: string;
    categoria: string;
    unidad_medida: string;
  } | null;

  epp_ubicaciones?: {
    nombre: string;
  } | null;
};

type ItemEntrega = {
  inventario_id: string;
  epp_id: string;
  codigo: string;
  nombre: string;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  disponible: number;
  cantidad: number;
};

const motivos = [
  { value: "INGRESO", label: "Ingreso del trabajador" },
  { value: "DOTACION", label: "Dotación" },
  { value: "REPOSICION", label: "Reposición" },
  { value: "CAMBIO_TALLA", label: "Cambio de talla" },
  { value: "DETERIORO", label: "Deterioro" },
  { value: "PERDIDA", label: "Pérdida" },
  { value: "VENCIMIENTO", label: "Vencimiento" },
  { value: "CONTAMINACION", label: "Contaminación" },
  {
    value: "REQUERIMIENTO_CLIENTE",
    label: "Requerimiento del cliente",
  },
  { value: "OTRO", label: "Otro" },
];

export default function EntregarEppPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [matrizCargo, setMatrizCargo] = useState<MatrizCargo[]>([]);

  const [trabajadorId, setTrabajadorId] = useState("");
  const [busquedaTrabajador, setBusquedaTrabajador] = useState("");
  const [mostrarResultadosTrabajador, setMostrarResultadosTrabajador] =
    useState(false);

  const [ubicacionId, setUbicacionId] = useState("");
  const [entregadoPor, setEntregadoPor] = useState("");
  const [motivo, setMotivo] = useState("DOTACION");
  const [observaciones, setObservaciones] = useState("");

  const [fechaEntrega, setFechaEntrega] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [inventarioSeleccionado, setInventarioSeleccionado] =
    useState("");
  const [cantidad, setCantidad] = useState("1");

  const [items, setItems] = useState<ItemEntrega[]>([]);

  const [busquedaInventario, setBusquedaInventario] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [
      respuestaTrabajadores,
      respuestaUbicaciones,
      respuestaInventario,
      respuestaMatrizCargo,
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
          talla_pantalon,
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
          fecha_vencimiento,
          cantidad_disponible,
          estado,
          epp_catalogo (
            codigo,
            nombre,
            categoria,
            unidad_medida
          ),
          epp_ubicaciones (
            nombre
          )
        `)
        .gt("cantidad_disponible", 0)
        .eq("estado", "DISPONIBLE")
        .order("created_at", { ascending: true }),

      supabase
        .from("epp_matriz_cargo")
        .select(`
          cargo,
          epp_id,
          obligatorio,
          cantidad_requerida,
          activo
        `)
        .eq("activo", true),
    ]);

    if (respuestaTrabajadores.error) {
      console.error(respuestaTrabajadores.error);

      setError(
        `No fue posible consultar trabajadores: ${respuestaTrabajadores.error.message}`
      );
    } else {
      setTrabajadores(
        (respuestaTrabajadores.data ?? []) as Trabajador[]
      );
    }

    if (respuestaUbicaciones.error) {
      console.error(respuestaUbicaciones.error);

      setError(
        `No fue posible consultar ubicaciones: ${respuestaUbicaciones.error.message}`
      );
    } else {
      setUbicaciones(
        (respuestaUbicaciones.data ?? []) as Ubicacion[]
      );
    }

    if (respuestaInventario.error) {
      console.error(respuestaInventario.error);

      setError(
        `No fue posible consultar inventario: ${respuestaInventario.error.message}`
      );
    } else {
      setInventario(
        (respuestaInventario.data ?? []) as unknown as Inventario[]
      );
    }

    if (respuestaMatrizCargo.error) {
      console.error(respuestaMatrizCargo.error);

      setError(
        `No fue posible consultar la matriz de EPP por cargo: ${respuestaMatrizCargo.error.message}`
      );
    } else {
      setMatrizCargo(
        (respuestaMatrizCargo.data ?? []) as MatrizCargo[]
      );
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const trabajadoresFiltrados = useMemo(() => {
    const texto = busquedaTrabajador.trim().toLowerCase();

    if (!texto) {
      return [];
    }

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

  const inventarioDisponible = useMemo(() => {
    if (!ubicacionId || !trabajadorSeleccionado?.cargo) {
      return [];
    }

    const cargoTrabajador = trabajadorSeleccionado.cargo
      .trim()
      .toUpperCase();

    const eppPermitidos = new Set(
      matrizCargo
        .filter(
          (registro) =>
            registro.cargo.trim().toUpperCase() === cargoTrabajador &&
            registro.activo
        )
        .map((registro) => registro.epp_id)
    );

    const texto = busquedaInventario.trim().toLowerCase();

    return inventario.filter((registro) => {
      if (registro.ubicacion_id !== ubicacionId) {
        return false;
      }

      if (registro.cantidad_disponible <= 0) {
        return false;
      }

      if (!eppPermitidos.has(registro.epp_id)) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const contenido = [
        registro.epp_catalogo?.codigo,
        registro.epp_catalogo?.nombre,
        registro.talla,
        registro.lote,
        registro.serial,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [
    inventario,
    ubicacionId,
    busquedaInventario,
    trabajadorSeleccionado?.cargo,
    matrizCargo,
  ]);

  const registroSeleccionado = inventario.find(
    (registro) => registro.id === inventarioSeleccionado
  );

  function agregarItem() {
    setError("");
    setMensaje("");

    if (!inventarioSeleccionado) {
      setError("Selecciona un EPP del inventario.");
      return;
    }

    if (!registroSeleccionado) {
      setError("No se encontró el inventario seleccionado.");
      return;
    }

    const cantidadNumero = Number(cantidad);

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
      cantidadNumero >
      registroSeleccionado.cantidad_disponible
    ) {
      setError(
        `Existencia insuficiente. Disponible: ${registroSeleccionado.cantidad_disponible}.`
      );
      return;
    }

    const yaExiste = items.some(
      (item) =>
        item.inventario_id === inventarioSeleccionado
    );

    if (yaExiste) {
      setError(
        "Ese registro de inventario ya fue agregado a la entrega."
      );
      return;
    }

    setItems((anteriores) => [
      ...anteriores,
      {
        inventario_id: registroSeleccionado.id,
        epp_id: registroSeleccionado.epp_id,
        codigo:
          registroSeleccionado.epp_catalogo?.codigo || "",
        nombre:
          registroSeleccionado.epp_catalogo?.nombre ||
          "EPP",
        talla: registroSeleccionado.talla,
        lote: registroSeleccionado.lote,
        serial: registroSeleccionado.serial,
        disponible:
          registroSeleccionado.cantidad_disponible,
        cantidad: cantidadNumero,
      },
    ]);

    setInventarioSeleccionado("");
    setCantidad("1");
  }

  function eliminarItem(inventarioId: string) {
    setItems((anteriores) =>
      anteriores.filter(
        (item) => item.inventario_id !== inventarioId
      )
    );
  }

  async function guardarEntrega() {
    setMensaje("");
    setError("");

    if (!trabajadorId) {
      setError("Selecciona el trabajador.");
      return;
    }

    if (!ubicacionId) {
      setError("Selecciona la ubicación de entrega.");
      return;
    }

    if (!fechaEntrega) {
      setError("Selecciona la fecha de entrega.");
      return;
    }

    if (!entregadoPor.trim()) {
      setError(
        "Debes indicar el nombre de quien realiza la entrega."
      );
      return;
    }

    if (items.length === 0) {
      setError(
        "Agrega al menos un EPP antes de guardar la entrega."
      );
      return;
    }

    setGuardando(true);

    const itemsRpc = items.map((item) => ({
      inventario_id: item.inventario_id,
      cantidad: item.cantidad,
    }));

  const { data, error: errorRpc } = await supabase.rpc(
  "registrar_entrega_epp",
  {
    p_trabajador_id: trabajadorId,
    p_ubicacion_id: ubicacionId,
    p_entregado_por: entregadoPor.trim(),
    p_motivo: motivo,
    p_observaciones:
      observaciones.trim() || null,
    p_items: itemsRpc,
    p_fecha_entrega: fechaEntrega,
  }
);

    if (errorRpc) {
      console.error(errorRpc);

      setError(
        `No fue posible registrar la entrega: ${errorRpc.message}`
      );

      setGuardando(false);
      return;
    }

    setMensaje(
      `Entrega registrada correctamente. ID: ${data}`
    );

    setItems([]);
    setInventarioSeleccionado("");
    setCantidad("1");
    setObservaciones("");

    await cargarDatos();

    setGuardando(false);
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

        <header>
          <a
            href="/control-trabajo/epp"
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a Gestión de EPP
          </a>

          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
            Entregar EPP
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-600">
            Registro de entrega de elementos de protección
            personal con control automático de inventario.
          </p>
        </header>

        {cargando ? (
          <div className="rounded-3xl border border-neutral-200 p-10 text-center">
            Cargando información...
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

              <h2 className="text-2xl font-black">
                Datos de la entrega
              </h2>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="relative">
                  <Etiqueta texto="Trabajador *" />

                  <input
                    type="search"
                    value={busquedaTrabajador}
                    onChange={(e) => {
                      setBusquedaTrabajador(e.target.value);
                      setMostrarResultadosTrabajador(true);

                      if (trabajadorId) {
                        setTrabajadorId("");
                        setInventarioSeleccionado("");
                        setItems([]);
                        setBusquedaInventario("");
                        setCantidad("1");
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
                              onClick={() => {
                                setTrabajadorId(
                                  trabajador.id
                                );

                                setBusquedaTrabajador(
                                  `${trabajador.nombres} ${trabajador.apellidos} - ${trabajador.identificacion}`
                                );

                                setMostrarResultadosTrabajador(
                                  false
                                );

                                setInventarioSeleccionado(
                                  ""
                                );

                                setItems([]);
                                setBusquedaInventario("");
                                setCantidad("1");
                              }}
                              className="block w-full border-b border-neutral-100 px-4 py-3 text-left last:border-b-0 hover:bg-neutral-50"
                            >
                              <div className="font-bold text-neutral-900">
                                {trabajador.nombres}{" "}
                                {trabajador.apellidos}
                              </div>

                              <div className="mt-1 text-sm text-neutral-500">
                                CC{" "}
                                {
                                  trabajador.identificacion
                                }
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

                <div>
                  <Etiqueta texto="Lugar de entrega *" />

                  <select
                    value={ubicacionId}
                    onChange={(e) => {
                      setUbicacionId(e.target.value);
                      setInventarioSeleccionado("");
                      setItems([]);
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
                    placeholder="Nombre del responsable de la entrega"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Motivo de la entrega *" />

                  <select
                    value={motivo}
                    onChange={(e) =>
                      setMotivo(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  >
                    {motivos.map((opcion) => (
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
                  <Etiqueta texto="Fecha de entrega *" />

                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) =>
                      setFechaEntrega(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

              </div>

              {trabajadorSeleccionado && (
                <div className="mt-6 rounded-2xl bg-neutral-50 p-5">
                  <div className="font-black">
                    {trabajadorSeleccionado.nombres}{" "}
                    {trabajadorSeleccionado.apellidos}
                  </div>

                  <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">

                    <Dato
                      titulo="Cargo"
                      valor={
                        trabajadorSeleccionado.cargo || "—"
                      }
                    />

                    <Dato
                      titulo="Base habitual"
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

            <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

              <h2 className="text-2xl font-black">
                Agregar EPP
              </h2>

              {!ubicacionId ? (
                <div className="mt-5 rounded-2xl bg-yellow-50 p-5 text-sm text-yellow-800">
                  Selecciona primero el lugar de entrega para
                  consultar las existencias disponibles.
                </div>
              ) : (
                <>
                  <input
                    type="search"
                    value={busquedaInventario}
                    onChange={(e) =>
                      setBusquedaInventario(e.target.value)
                    }
                    placeholder="Buscar por código, EPP, talla, lote o serial..."
                    className="mt-5 w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_150px_auto] gap-4">

                    <div>
                      <Etiqueta texto="EPP disponible *" />

                      <select
                        value={inventarioSeleccionado}
                        onChange={(e) =>
                          setInventarioSeleccionado(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                      >
                        <option value="">
                          Seleccionar EPP...
                        </option>

                        {inventarioDisponible.map(
                          (registro) => (
                            <option
                              key={registro.id}
                              value={registro.id}
                            >
                              {
                                registro.epp_catalogo
                                  ?.codigo
                              }{" "}
                              -{" "}
                              {
                                registro.epp_catalogo
                                  ?.nombre
                              }

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
                          registroSeleccionado?.cantidad_disponible
                        }
                        value={cantidad}
                        onChange={(e) =>
                          setCantidad(e.target.value)
                        }
                        className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={agregarItem}
                        className="w-full rounded-xl bg-neutral-900 px-5 py-3 font-bold text-white"
                      >
                        Agregar
                      </button>
                    </div>

                  </div>
                </>
              )}

            </section>

            <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">
                    EPP a entregar
                  </h2>

                  <p className="mt-1 text-sm text-neutral-600">
                    {items.length} elementos agregados
                  </p>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-neutral-50 p-10 text-center text-neutral-500">
                  No has agregado EPP a esta entrega.
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">

                  <table className="w-full min-w-[850px] text-sm">

                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-3 pr-4">
                          Código
                        </th>

                        <th className="py-3 pr-4">
                          EPP
                        </th>

                        <th className="py-3 pr-4">
                          Talla
                        </th>

                        <th className="py-3 pr-4">
                          Lote
                        </th>

                        <th className="py-3 pr-4">
                          Serial
                        </th>

                        <th className="py-3 pr-4">
                          Cantidad
                        </th>

                        <th className="py-3">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.inventario_id}
                          className="border-b border-neutral-100"
                        >
                          <td className="py-4 pr-4 font-bold">
                            {item.codigo}
                          </td>

                          <td className="py-4 pr-4">
                            {item.nombre}
                          </td>

                          <td className="py-4 pr-4">
                            {item.talla || "No aplica"}
                          </td>

                          <td className="py-4 pr-4">
                            {item.lote || "—"}
                          </td>

                          <td className="py-4 pr-4">
                            {item.serial || "—"}
                          </td>

                          <td className="py-4 pr-4 font-black">
                            {item.cantidad}
                          </td>

                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() =>
                                eliminarItem(
                                  item.inventario_id
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>
              )}

              <div className="mt-7">
                <Etiqueta texto="Observaciones de la entrega" />

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
                onClick={guardarEntrega}
                disabled={guardando || items.length === 0}
                className="mt-6 w-full rounded-xl bg-neutral-950 py-4 text-lg font-black text-white disabled:opacity-40"
              >
                {guardando
                  ? "Registrando entrega..."
                  : "Confirmar entrega de EPP"}
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
          </>
        )}

      </div>
    </main>
  );
}

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