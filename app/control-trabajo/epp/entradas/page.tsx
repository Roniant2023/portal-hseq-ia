"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ubicacion = {
  id: string;
  nombre: string;
};

type EppCatalogo = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad_medida: string;
  requiere_talla: boolean;
  activo: boolean;
};

type ItemEntrada = {
  epp_id: string;
  codigo: string;
  nombre: string;
  talla: string;
  cantidad: number;
  lote: string;
  serial: string;
  fecha_fabricacion: string;
  fecha_vencimiento: string;
  costo_unitario: string;
  observaciones: string;
};
const TALLAS_ROPA = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
];

const TALLAS_CALZADO = [
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
];

const CODIGOS_CALZADO = [
  "EPP-041",
  "EPP-042",
  "EPP-043",
];
export default function EntradasEppPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [catalogo, setCatalogo] = useState<EppCatalogo[]>([]);

  const [ubicacionId, setUbicacionId] = useState("");
const [otraUbicacion, setOtraUbicacion] = useState("");
  const [realizadoPor, setRealizadoPor] = useState("");
  const [documentoReferencia, setDocumentoReferencia] = useState("");
  const [motivo, setMotivo] = useState("Ingreso de inventario");

  const [busqueda, setBusqueda] = useState("");
  const [eppId, setEppId] = useState("");
  const [talla, setTalla] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [lote, setLote] = useState("");
  const [serial, setSerial] = useState("");
  const [fechaFabricacion, setFechaFabricacion] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [observacionItem, setObservacionItem] = useState("");

  const [items, setItems] = useState<ItemEntrada[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [respuestaUbicaciones, respuestaCatalogo] = await Promise.all([
      supabase
        .from("epp_ubicaciones")
        .select("id,nombre")
        .eq("activo", true)
        .order("nombre"),

      supabase
        .from("epp_catalogo")
        .select(`
          id,
          codigo,
          nombre,
          categoria,
          unidad_medida,
          requiere_talla,
          activo
        `)
        .eq("activo", true)
        .order("categoria")
        .order("codigo"),
    ]);

    if (respuestaUbicaciones.error) {
      console.error(respuestaUbicaciones.error);
      setError(
        `No fue posible consultar las ubicaciones: ${respuestaUbicaciones.error.message}`
      );
    } else {
      setUbicaciones(
        (respuestaUbicaciones.data ?? []) as Ubicacion[]
      );
    }

    if (respuestaCatalogo.error) {
      console.error(respuestaCatalogo.error);
      setError(
        `No fue posible consultar el catálogo de EPP: ${respuestaCatalogo.error.message}`
      );
    } else {
      setCatalogo(
        (respuestaCatalogo.data ?? []) as EppCatalogo[]
      );
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const catalogoFiltrado = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return catalogo;
    }

    return catalogo.filter((epp) => {
      const contenido = [
        epp.codigo,
        epp.nombre,
        epp.categoria,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [catalogo, busqueda]);

  const eppSeleccionado = catalogo.find(
    (epp) => epp.id === eppId
  );
const opcionesTalla = useMemo(() => {
  if (!eppSeleccionado?.requiere_talla) {
    return [];
  }

  if (CODIGOS_CALZADO.includes(eppSeleccionado.codigo)) {
    return TALLAS_CALZADO;
  }

  return TALLAS_ROPA;
}, [eppSeleccionado]);
  function limpiarFormularioItem() {
    setEppId("");
    setTalla("");
    setCantidad("1");
    setLote("");
    setSerial("");
    setFechaFabricacion("");
    setFechaVencimiento("");
    setCostoUnitario("");
    setObservacionItem("");
  }

  function agregarItem() {
    setError("");
    setMensaje("");

    if (!eppSeleccionado) {
      setError("Selecciona un EPP.");
      return;
    }
if (eppSeleccionado.requiere_talla && !talla) {
  setError("Selecciona la talla del EPP.");
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
      costoUnitario &&
      (Number.isNaN(Number(costoUnitario)) ||
        Number(costoUnitario) < 0)
    ) {
      setError("El costo unitario no es válido.");
      return;
    }

    const nuevoItem: ItemEntrada = {
      epp_id: eppSeleccionado.id,
      codigo: eppSeleccionado.codigo,
      nombre: eppSeleccionado.nombre,
      talla: talla.trim().toUpperCase(),
      cantidad: cantidadNumero,
      lote: lote.trim().toUpperCase(),
      serial: serial.trim().toUpperCase(),
      fecha_fabricacion: fechaFabricacion,
      fecha_vencimiento: fechaVencimiento,
      costo_unitario: costoUnitario,
      observaciones: observacionItem.trim(),
    };

    setItems((anteriores) => [
      ...anteriores,
      nuevoItem,
    ]);

    limpiarFormularioItem();
  }

  function eliminarItem(indice: number) {
    setItems((anteriores) =>
      anteriores.filter((_, i) => i !== indice)
    );
  }

  async function guardarEntrada() {
    setMensaje("");
    setError("");

    if (!ubicacionId) {
      setError("Selecciona la ubicación de ingreso.");
      return;
    }
if (ubicacionId === "OTRO" && !otraUbicacion.trim()) {
  setError("Escribe el nombre de la nueva ubicación.");
  return;
}
    if (!realizadoPor.trim()) {
      setError(
        "Debes indicar quién realiza la entrada."
      );
      return;
    }

    if (items.length === 0) {
      setError(
        "Agrega al menos un EPP antes de registrar la entrada."
      );
      return;
    }

    setGuardando(true);

let ubicacionFinalId = ubicacionId;

if (ubicacionId === "OTRO") {
  const nombreNuevaUbicacion = otraUbicacion
    .trim()
    .toUpperCase();

  const ubicacionExistente = ubicaciones.find(
    (ubicacion) =>
      ubicacion.nombre.trim().toUpperCase() ===
      nombreNuevaUbicacion
  );

  if (ubicacionExistente) {
    ubicacionFinalId = ubicacionExistente.id;
  } else {
    const {
      data: nuevaUbicacion,
      error: errorUbicacion,
    } = await supabase
      .from("epp_ubicaciones")
      .insert({
        nombre: nombreNuevaUbicacion,
        activo: true,
      })
      .select("id,nombre")
      .single();

    if (errorUbicacion || !nuevaUbicacion) {
      console.error(errorUbicacion);

      setError(
        `No fue posible crear la nueva ubicación: ${
          errorUbicacion?.message ||
          "Error desconocido"
        }`
      );

      setGuardando(false);
      return;
    }

    ubicacionFinalId = nuevaUbicacion.id;

    setUbicaciones((anteriores) =>
      [...anteriores, nuevaUbicacion as Ubicacion].sort(
        (a, b) => a.nombre.localeCompare(b.nombre)
      )
    );
  }
}

const itemsRpc = items.map((item) => ({

    
      epp_id: item.epp_id,
      cantidad: item.cantidad,
      talla: item.talla || null,
      lote: item.lote || null,
      serial: item.serial || null,
      fecha_fabricacion:
        item.fecha_fabricacion || null,
      fecha_vencimiento:
        item.fecha_vencimiento || null,
      costo_unitario:
        item.costo_unitario || null,
      observaciones:
        item.observaciones || null,
    }));

    const { data, error: errorRpc } =
      await supabase.rpc("registrar_entrada_epp", {
        p_ubicacion_id: ubicacionFinalId,
        p_realizado_por: realizadoPor.trim(),
        p_documento_referencia:
          documentoReferencia.trim() || null,
        p_motivo: motivo.trim() || null,
        p_items: itemsRpc,
      });

    if (errorRpc) {
      console.error(errorRpc);
      setError(
        `No fue posible registrar la entrada: ${errorRpc.message}`
      );
      setGuardando(false);
      return;
    }

    setMensaje(
      `Entrada registrada correctamente. ${Array.isArray(data) ? data.length : items.length} registros creados.`
    );

    setItems([]);
    setDocumentoReferencia("");
    setMotivo("Ingreso de inventario");
    setBusqueda("");
    limpiarFormularioItem();

    setGuardando(false);
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">

        <header>
          <a
            href="/control-trabajo/epp"
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a Gestión de EPP
          </a>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Entradas de EPP
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-600">
            Registro de ingresos de elementos de protección
            personal al inventario.
          </p>
        </header>

        {cargando ? (
          <div className="rounded-3xl border border-neutral-200 p-10 text-center">
            Cargando información...
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-neutral-200 p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-black">
                Datos de la entrada
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Etiqueta texto="Ubicación de ingreso *" />

                  <select
                    value={ubicacionId}
                    onChange={(e) =>
                      setUbicacionId(e.target.value)
                    }
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
<option value="OTRO">OTRO</option>
                  </select>
{ubicacionId === "OTRO" && (
  <input
    value={otraUbicacion}
    onChange={(e) =>
      setOtraUbicacion(e.target.value.toUpperCase())
    }
    placeholder="Escribe la nueva ubicación..."
    className="mt-3 w-full rounded-xl border border-neutral-300 px-4 py-3"
  />
)}
                </div>

                <div>
                  <Etiqueta texto="Recibido / registrado por *" />

                  <input
                    value={realizadoPor}
                    onChange={(e) =>
                      setRealizadoPor(e.target.value)
                    }
                    placeholder="Nombre del responsable"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Documento de referencia" />

                  <input
                    value={documentoReferencia}
                    onChange={(e) =>
                      setDocumentoReferencia(
                        e.target.value
                      )
                    }
                    placeholder="Factura, remisión, OC, acta..."
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Motivo" />

                  <input
                    value={motivo}
                    onChange={(e) =>
                      setMotivo(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-black">
                Agregar EPP
              </h2>

              <input
                type="search"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
                placeholder="Buscar por código, nombre o categoría..."
                className="mt-5 w-full rounded-xl border border-neutral-300 px-4 py-3"
              />

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Etiqueta texto="EPP *" />

                  <select
                    value={eppId}
                    onChange={(e) => {
                      setEppId(e.target.value);
                      setTalla("");
                    }}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  >
                    <option value="">
                      Seleccionar EPP...
                    </option>

                    {catalogoFiltrado.map((epp) => (
                      <option
                        key={epp.id}
                        value={epp.id}
                      >
                        {epp.codigo} - {epp.nombre} |{" "}
                        {epp.categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
  <Etiqueta texto="Talla" />

  {eppSeleccionado?.requiere_talla ? (
    <select
      value={talla}
      onChange={(e) => setTalla(e.target.value)}
      className="w-full rounded-xl border border-neutral-300 px-4 py-3"
    >
      <option value="">Seleccionar talla...</option>

      {opcionesTalla.map((opcion) => (
        <option key={opcion} value={opcion}>
          {opcion}
        </option>
      ))}
    </select>
  ) : (
    <input
      value="No aplica"
      disabled
      className="w-full rounded-xl border border-neutral-300 bg-neutral-100 px-4 py-3 text-neutral-500"
    />
  )}
</div>

                <div>
                  <Etiqueta texto="Cantidad *" />

                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) =>
                      setCantidad(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Lote" />

                  <input
                    value={lote}
                    onChange={(e) =>
                      setLote(e.target.value)
                    }
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Serial" />

                  <input
                    value={serial}
                    onChange={(e) =>
                      setSerial(e.target.value)
                    }
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Fecha de fabricación" />

                  <input
                    type="date"
                    value={fechaFabricacion}
                    onChange={(e) =>
                      setFechaFabricacion(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Fecha de vencimiento" />

                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) =>
                      setFechaVencimiento(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Costo unitario" />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costoUnitario}
                    onChange={(e) =>
                      setCostoUnitario(
                        e.target.value
                      )
                    }
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>

                <div>
                  <Etiqueta texto="Observaciones del EPP" />

                  <input
                    value={observacionItem}
                    onChange={(e) =>
                      setObservacionItem(
                        e.target.value
                      )
                    }
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={agregarItem}
                className="mt-6 rounded-xl bg-neutral-900 px-6 py-3 font-bold text-white"
              >
                Agregar a la entrada
              </button>
            </section>

            <section className="rounded-3xl border border-neutral-200 p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-black">
                EPP a ingresar
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                {items.length} registros agregados
              </p>

              {items.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-neutral-50 p-10 text-center text-neutral-500">
                  No has agregado elementos a esta entrada.
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-sm">
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
                          Cantidad
                        </th>
                        <th className="py-3 pr-4">
                          Lote
                        </th>
                        <th className="py-3 pr-4">
                          Serial
                        </th>
                        <th className="py-3 pr-4">
                          Vencimiento
                        </th>
                        <th className="py-3">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, indice) => (
                        <tr
                          key={`${item.epp_id}-${indice}`}
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

                          <td className="py-4 pr-4 font-black">
                            {item.cantidad}
                          </td>

                          <td className="py-4 pr-4">
                            {item.lote || "—"}
                          </td>

                          <td className="py-4 pr-4">
                            {item.serial || "—"}
                          </td>

                          <td className="py-4 pr-4">
                            {item.fecha_vencimiento ||
                              "—"}
                          </td>

                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() =>
                                eliminarItem(indice)
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

              <button
                type="button"
                onClick={guardarEntrada}
                disabled={
                  guardando || items.length === 0
                }
                className="mt-7 w-full rounded-xl bg-neutral-950 py-4 text-lg font-black text-white disabled:opacity-40"
              >
                {guardando
                  ? "Registrando entrada..."
                  : "Confirmar entrada de EPP"}
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