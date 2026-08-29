"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ubicacion = {
  id: string;
  nombre: string;
  tipo: "BASE" | "LOTE" | "OPERACION" | "UNIDAD" | "OTRO";
  ciudad: string | null;
  departamento: string | null;
  activo: boolean;
  observaciones: string | null;
};

const formularioInicial = {
  nombre: "",
  tipo: "BASE",
  ciudad: "",
  departamento: "",
  observaciones: "",
};

export default function UbicacionesEppPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [form, setForm] = useState(formularioInicial);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargarUbicaciones() {
    setCargando(true);
    setError("");

    const { data, error } = await supabase
      .from("epp_ubicaciones")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error(error);
      setError(
        `No fue posible consultar las ubicaciones: ${error.message}`
      );
      setUbicaciones([]);
    } else {
      setUbicaciones((data ?? []) as Ubicacion[]);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  function actualizarCampo(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function registrarUbicacion(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (!form.nombre.trim()) {
      setError("Debes ingresar el nombre de la ubicación.");
      return;
    }

    setGuardando(true);

    const nuevaUbicacion = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      ciudad: form.ciudad.trim() || null,
      departamento: form.departamento.trim() || null,
      observaciones: form.observaciones.trim() || null,
      activo: true,
    };

    const { error } = await supabase
      .from("epp_ubicaciones")
      .insert(nuevaUbicacion);

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setError("Ya existe una ubicación con ese nombre.");
      } else {
        setError(
          `No fue posible registrar la ubicación: ${error.message}`
        );
      }

      setGuardando(false);
      return;
    }

    setForm(formularioInicial);
    setMensaje("Ubicación registrada correctamente.");

    await cargarUbicaciones();

    setGuardando(false);
  }

  async function cambiarEstado(
    ubicacion: Ubicacion
  ) {
    setMensaje("");
    setError("");

    const nuevoEstado = !ubicacion.activo;

    const { error } = await supabase
      .from("epp_ubicaciones")
      .update({
        activo: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ubicacion.id);

    if (error) {
      console.error(error);
      setError(
        `No fue posible actualizar la ubicación: ${error.message}`
      );
      return;
    }

    setMensaje(
      `Ubicación ${
        nuevoEstado ? "activada" : "inactivada"
      } correctamente.`
    );

    await cargarUbicaciones();
  }

  const ubicacionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return ubicaciones;

    return ubicaciones.filter((ubicacion) => {
      const contenido = [
        ubicacion.nombre,
        ubicacion.tipo,
        ubicacion.ciudad,
        ubicacion.departamento,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [ubicaciones, busqueda]);

  const total = ubicaciones.length;
  const activas = ubicaciones.filter((u) => u.activo).length;
  const inactivas = total - activas;

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
            Ubicaciones EPP
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-600">
            Administración de bases, lotes, operaciones y puntos de
            almacenamiento o entrega de EPP.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Indicador titulo="Ubicaciones registradas" valor={total} />
          <Indicador titulo="Activas" valor={activas} />
          <Indicador titulo="Inactivas" valor={inactivas} />
        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-black">
            Registrar ubicación
          </h2>

          <p className="mt-1 text-sm text-neutral-600">
            Registra una base o punto desde donde se almacenará o entregará EPP.
          </p>

          <form
            onSubmit={registrarUbicacion}
            className="mt-7 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

              <Campo
                label="Nombre *"
                value={form.nombre}
                placeholder="Ej. Base Palermo"
                onChange={(v) =>
                  actualizarCampo("nombre", v)
                }
              />

              <div>
                <label className="block mb-2 text-sm font-bold">
                  Tipo *
                </label>

                <select
                  value={form.tipo}
                  onChange={(e) =>
                    actualizarCampo("tipo", e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                >
                  <option value="BASE">Base</option>
                  <option value="LOTE">Lote</option>
                  <option value="OPERACION">Operación</option>
                  <option value="UNIDAD">Unidad</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <Campo
                label="Ciudad"
                value={form.ciudad}
                placeholder="Ej. Neiva"
                onChange={(v) =>
                  actualizarCampo("ciudad", v)
                }
              />

              <Campo
                label="Departamento"
                value={form.departamento}
                placeholder="Ej. Huila"
                onChange={(v) =>
                  actualizarCampo("departamento", v)
                }
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold">
                Observaciones
              </label>

              <textarea
                value={form.observaciones}
                onChange={(e) =>
                  actualizarCampo(
                    "observaciones",
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Observaciones adicionales..."
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-neutral-950 px-6 py-3 font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : "Registrar ubicación"}
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
                Ubicaciones registradas
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                {ubicacionesFiltradas.length} resultados
              </p>
            </div>

            <input
              type="search"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por nombre, ciudad o tipo..."
              className="w-full md:w-[420px] rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div className="mt-6 overflow-x-auto">

            {cargando ? (
              <div className="py-10 text-center text-neutral-500">
                Cargando ubicaciones...
              </div>
            ) : ubicacionesFiltradas.length === 0 ? (
              <div className="rounded-2xl bg-neutral-50 p-10 text-center">
                <div className="text-5xl">📍</div>

                <p className="mt-4 font-bold">
                  No hay ubicaciones registradas
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Ubicación</th>
                    <th className="py-3 pr-4">Tipo</th>
                    <th className="py-3 pr-4">Ciudad</th>
                    <th className="py-3 pr-4">Departamento</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {ubicacionesFiltradas.map((ubicacion) => (
                    <tr
                      key={ubicacion.id}
                      className="border-b border-neutral-100"
                    >
                      <td className="py-4 pr-4 font-bold">
                        {ubicacion.nombre}
                      </td>

                      <td className="py-4 pr-4">
                        {ubicacion.tipo}
                      </td>

                      <td className="py-4 pr-4">
                        {ubicacion.ciudad || "—"}
                      </td>

                      <td className="py-4 pr-4">
                        {ubicacion.departamento || "—"}
                      </td>

                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            ubicacion.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-200 text-neutral-600"
                          }`}
                        >
                          {ubicacion.activo
                            ? "ACTIVA"
                            : "INACTIVA"}
                        </span>
                      </td>

                      <td className="py-4">
                        <button
                          type="button"
                          onClick={() =>
                            cambiarEstado(ubicacion)
                          }
                          className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold hover:bg-neutral-100"
                        >
                          {ubicacion.activo
                            ? "Inactivar"
                            : "Activar"}
                        </button>
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
      <p className="text-sm text-neutral-500">
        {titulo}
      </p>

      <p className="mt-1 text-3xl font-black">
        {valor}
      </p>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block mb-2 text-sm font-bold">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
      />
    </div>
  );
}