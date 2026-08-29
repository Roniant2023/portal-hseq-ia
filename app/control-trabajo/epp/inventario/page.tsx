"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Epp = {
  id: string;
  codigo: string;
  nombre: string;
  requiere_talla: boolean;
  requiere_serial: boolean;
  requiere_lote: boolean;
  requiere_vencimiento: boolean;
  activo: boolean;
};

type Ubicacion = {
  id: string;
  nombre: string;
  activo: boolean;
};

type Inventario = {
  id: string;
  epp_id: string;
  ubicacion_id: string;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  fecha_ingreso: string;
  fecha_fabricacion: string | null;
  fecha_vencimiento: string | null;
  cantidad_inicial: number;
  cantidad_disponible: number;
  costo_unitario: number | null;
  estado: string;
  observaciones: string | null;
  epp_catalogo?: {
    codigo: string;
    nombre: string;
  } | null;
  epp_ubicaciones?: {
    nombre: string;
  } | null;
};

const inicial = {
  epp_id: "",
  ubicacion_id: "",
  talla: "",
  lote: "",
  serial: "",
  fecha_fabricacion: "",
  fecha_vencimiento: "",
  cantidad: "1",
  costo_unitario: "",
  observaciones: "",
};

export default function InventarioEppPage() {
  const [catalogo, setCatalogo] = useState<Epp[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [form, setForm] = useState(inicial);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const eppSeleccionado = catalogo.find(
    (epp) => epp.id === form.epp_id
  );

  async function cargarDatos() {
    setCargando(true);

    const [respuestaEpp, respuestaUbicaciones, respuestaInventario] =
      await Promise.all([
        supabase
          .from("epp_catalogo")
          .select(
            "id,codigo,nombre,requiere_talla,requiere_serial,requiere_lote,requiere_vencimiento,activo"
          )
          .eq("activo", true)
          .order("nombre"),

        supabase
          .from("epp_ubicaciones")
          .select("id,nombre,activo")
          .eq("activo", true)
          .order("nombre"),

        supabase
          .from("epp_inventario")
          .select(`
            *,
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
      setCatalogo((respuestaEpp.data ?? []) as Epp[]);
    }

    if (respuestaUbicaciones.error) {
      console.error(respuestaUbicaciones.error);
    } else {
      setUbicaciones(
        (respuestaUbicaciones.data ?? []) as Ubicacion[]
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

  function cambiar(campo: keyof typeof form, valor: string) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function registrarIngreso(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (!form.epp_id) {
      setError("Selecciona el EPP.");
      return;
    }

    if (!form.ubicacion_id) {
      setError("Selecciona la ubicación.");
      return;
    }

    const cantidad = Number(form.cantidad);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser un número entero mayor que cero.");
      return;
    }

    if (eppSeleccionado?.requiere_talla && !form.talla.trim()) {
      setError("Este EPP requiere talla.");
      return;
    }

    if (eppSeleccionado?.requiere_serial && !form.serial.trim()) {
      setError("Este EPP requiere serial.");
      return;
    }

    if (eppSeleccionado?.requiere_serial && cantidad !== 1) {
      setError(
        "Los EPP controlados por serial deben ingresarse uno por uno."
      );
      return;
    }

    if (eppSeleccionado?.requiere_lote && !form.lote.trim()) {
      setError("Este EPP requiere número de lote.");
      return;
    }

    if (
      eppSeleccionado?.requiere_vencimiento &&
      !form.fecha_vencimiento
    ) {
      setError("Este EPP requiere fecha de vencimiento.");
      return;
    }

    setGuardando(true);

    const registro = {
      epp_id: form.epp_id,
      ubicacion_id: form.ubicacion_id,

      talla: form.talla.trim() || null,
      lote: form.lote.trim() || null,
      serial: form.serial.trim() || null,

      fecha_fabricacion: form.fecha_fabricacion || null,
      fecha_vencimiento: form.fecha_vencimiento || null,

      cantidad_inicial: cantidad,
      cantidad_disponible: cantidad,

      costo_unitario: form.costo_unitario
        ? Number(form.costo_unitario)
        : null,

      estado: "DISPONIBLE",

      observaciones: form.observaciones.trim() || null,
    };

    const { error: errorInsert } = await supabase
      .from("epp_inventario")
      .insert(registro);

    if (errorInsert) {
      console.error(errorInsert);
      setError(
        `No fue posible registrar el ingreso: ${errorInsert.message}`
      );
      setGuardando(false);
      return;
    }

    setForm(inicial);
    setMensaje("Ingreso de inventario registrado correctamente.");

    await cargarDatos();

    setGuardando(false);
  }

  const inventarioFiltrado = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return inventario;

    return inventario.filter((item) => {
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
  }, [inventario, busqueda]);

  const totalDisponible = inventario.reduce(
    (total, item) => total + Number(item.cantidad_disponible || 0),
    0
  );

  const referencias = new Set(
    inventario.map((item) => item.epp_id)
  ).size;

  const ubicacionesConStock = new Set(
    inventario
      .filter((item) => item.cantidad_disponible > 0)
      .map((item) => item.ubicacion_id)
  ).size;

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
            Inventario de EPP
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-600">
            Control de existencias de elementos de protección personal
            por ubicación, talla, lote y serial.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Indicador
            titulo="Unidades disponibles"
            valor={totalDisponible}
          />

          <Indicador
            titulo="Referencias con inventario"
            valor={referencias}
          />

          <Indicador
            titulo="Ubicaciones con existencias"
            valor={ubicacionesConStock}
          />
        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

          <h2 className="text-2xl font-black">
            Ingreso de EPP
          </h2>

          <p className="mt-1 text-sm text-neutral-600">
            Registra nuevas existencias en una ubicación.
          </p>

          <form
            onSubmit={registrarIngreso}
            className="mt-7 space-y-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              <div>
                <Etiqueta texto="EPP *" />

                <select
                  value={form.epp_id}
                  onChange={(e) => {
                    setForm((anterior) => ({
                      ...anterior,
                      epp_id: e.target.value,
                      talla: "",
                      lote: "",
                      serial: "",
                      fecha_vencimiento: "",
                    }));
                  }}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                >
                  <option value="">Seleccionar...</option>

                  {catalogo.map((epp) => (
                    <option key={epp.id} value={epp.id}>
                      {epp.codigo} - {epp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Etiqueta texto="Ubicación *" />

                <select
                  value={form.ubicacion_id}
                  onChange={(e) =>
                    cambiar("ubicacion_id", e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                >
                  <option value="">Seleccionar...</option>

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

              <Campo
                label="Cantidad *"
                type="number"
                min="1"
                value={form.cantidad}
                onChange={(v) => cambiar("cantidad", v)}
              />

              {eppSeleccionado?.requiere_talla && (
                <Campo
                  label="Talla *"
                  value={form.talla}
                  placeholder="Ej. 42, M, L"
                  onChange={(v) => cambiar("talla", v)}
                />
              )}

              {eppSeleccionado?.requiere_lote && (
                <Campo
                  label="Lote *"
                  value={form.lote}
                  onChange={(v) => cambiar("lote", v)}
                />
              )}

              {eppSeleccionado?.requiere_serial && (
                <Campo
                  label="Serial *"
                  value={form.serial}
                  onChange={(v) => cambiar("serial", v)}
                />
              )}

              <Campo
                label="Fecha de fabricación"
                type="date"
                value={form.fecha_fabricacion}
                onChange={(v) =>
                  cambiar("fecha_fabricacion", v)
                }
              />

              {(eppSeleccionado?.requiere_vencimiento ||
                form.fecha_vencimiento) && (
                <Campo
                  label={
                    eppSeleccionado?.requiere_vencimiento
                      ? "Fecha de vencimiento *"
                      : "Fecha de vencimiento"
                  }
                  type="date"
                  value={form.fecha_vencimiento}
                  onChange={(v) =>
                    cambiar("fecha_vencimiento", v)
                  }
                />
              )}

              <Campo
                label="Costo unitario"
                type="number"
                min="0"
                step="0.01"
                value={form.costo_unitario}
                placeholder="Ej. 85000"
                onChange={(v) =>
                  cambiar("costo_unitario", v)
                }
              />
            </div>

            <div>
              <Etiqueta texto="Observaciones" />

              <textarea
                value={form.observaciones}
                onChange={(e) =>
                  cambiar("observaciones", e.target.value)
                }
                rows={3}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                placeholder="Factura, proveedor u observaciones del ingreso..."
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-neutral-950 px-6 py-3 font-bold text-white disabled:opacity-50"
            >
              {guardando
                ? "Registrando..."
                : "Registrar ingreso"}
            </button>

            {mensaje && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>
        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="text-2xl font-black">
                Existencias
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                {inventarioFiltrado.length} registros
              </p>
            </div>

            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar EPP, ubicación, talla, lote..."
              className="w-full md:w-[420px] rounded-xl border border-neutral-300 px-4 py-3"
            />
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
                  No hay existencias registradas
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
                    <th className="py-3 pr-4">Lote</th>
                    <th className="py-3 pr-4">Serial</th>
                    <th className="py-3 pr-4">Inicial</th>
                    <th className="py-3 pr-4">Disponible</th>
                    <th className="py-3">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {inventarioFiltrado.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-neutral-100"
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

                      <td className="py-4 pr-4">
                        {item.lote || "—"}
                      </td>

                      <td className="py-4 pr-4">
                        {item.serial || "—"}
                      </td>

                      <td className="py-4 pr-4">
                        {item.cantidad_inicial}
                      </td>

                      <td className="py-4 pr-4 font-black">
                        {item.cantidad_disponible}
                      </td>

                      <td className="py-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
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
      <p className="mt-1 text-3xl font-black">{valor}</p>
    </div>
  );
}

function Etiqueta({ texto }: { texto: string }) {
  return (
    <label className="mb-2 block text-sm font-bold">
      {texto}
    </label>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <Etiqueta texto={label} />

      <input
        type={type}
        min={min}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-4 py-3"
      />
    </div>
  );
}