 "use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Trabajador = {
  id: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  cargo: string | null;
  area_operacion: string | null;
  base: string | null;
  empresa: string | null;
  fecha_ingreso: string | null;
  talla_overol: string | null;
  talla_pantalon: string | null;
  talla_calzado: string | null;
  talla_guantes: string | null;
  estado: "ACTIVO" | "INACTIVO";
  observaciones: string | null;
  created_at: string;
};

const formularioInicial = {
  identificacion: "",
  nombres: "",
  apellidos: "",
  cargo: "",
  area_operacion: "",
  base: "",
  empresa: "Estrella International Energy Services",
  fecha_ingreso: "",
  talla_overol: "",
  talla_pantalon: "",
  talla_calzado: "",
  talla_guantes: "",
  observaciones: "",
};

export default function TrabajadoresEppPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [form, setForm] = useState(formularioInicial);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargarTrabajadores() {
    setCargando(true);
    setError("");

    const { data, error } = await supabase
      .from("epp_trabajadores")
      .select("*")
      .order("apellidos", { ascending: true })
      .order("nombres", { ascending: true });

    if (error) {
      console.error(error);
      setError(
        `No fue posible consultar los trabajadores: ${error.message}`
      );
      setTrabajadores([]);
    } else {
      setTrabajadores((data ?? []) as Trabajador[]);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarTrabajadores();
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

  async function registrarTrabajador(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (!form.identificacion.trim()) {
      setError("Debes ingresar la identificación del trabajador.");
      return;
    }

    if (!form.nombres.trim()) {
      setError("Debes ingresar los nombres del trabajador.");
      return;
    }

    if (!form.apellidos.trim()) {
      setError("Debes ingresar los apellidos del trabajador.");
      return;
    }

    setGuardando(true);

    const nuevoTrabajador = {
      identificacion: form.identificacion.trim(),
      nombres: form.nombres.trim().toUpperCase(),
      apellidos: form.apellidos.trim().toUpperCase(),

      cargo: form.cargo.trim() || null,
      area_operacion: form.area_operacion.trim() || null,
      base: form.base.trim() || null,

      empresa:
        form.empresa.trim() ||
        "Estrella International Energy Services",

      fecha_ingreso: form.fecha_ingreso || null,

      talla_overol: form.talla_overol.trim() || null,
      talla_pantalon: form.talla_pantalon.trim() || null,
      talla_calzado: form.talla_calzado.trim() || null,
      talla_guantes: form.talla_guantes.trim() || null,

      estado: "ACTIVO",

      observaciones:
        form.observaciones.trim() || null,
    };

    const { error } = await supabase
      .from("epp_trabajadores")
      .insert(nuevoTrabajador);

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setError(
          "Ya existe un trabajador registrado con esa identificación."
        );
      } else {
        setError(
          `No fue posible registrar el trabajador: ${error.message}`
        );
      }

      setGuardando(false);
      return;
    }

    setForm(formularioInicial);

    setMensaje(
      "Trabajador registrado correctamente."
    );

    await cargarTrabajadores();

    setGuardando(false);
  }

  async function cambiarEstado(
    trabajador: Trabajador
  ) {
    setMensaje("");
    setError("");

    const nuevoEstado =
      trabajador.estado === "ACTIVO"
        ? "INACTIVO"
        : "ACTIVO";

    const { error } = await supabase
      .from("epp_trabajadores")
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trabajador.id);

    if (error) {
      console.error(error);

      setError(
        `No fue posible actualizar el trabajador: ${error.message}`
      );

      return;
    }

    setMensaje(
      `Trabajador ${
        nuevoEstado === "ACTIVO"
          ? "activado"
          : "inactivado"
      } correctamente.`
    );

    await cargarTrabajadores();
  }

  const trabajadoresFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return trabajadores;
    }

    return trabajadores.filter(
      (trabajador) => {
        const contenido = [
          trabajador.identificacion,
          trabajador.nombres,
          trabajador.apellidos,
          trabajador.cargo,
          trabajador.area_operacion,
          trabajador.base,
          trabajador.empresa,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return contenido.includes(texto);
      }
    );
  }, [trabajadores, busqueda]);

  const total = trabajadores.length;

  const activos =
    trabajadores.filter(
      (trabajador) =>
        trabajador.estado === "ACTIVO"
    ).length;

  const inactivos =
    total - activos;

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
            Trabajadores
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-600">
            Registro y consulta del personal
            para la gestión de entrega y
            seguimiento de EPP.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Indicador
            titulo="Trabajadores registrados"
            valor={total}
          />

          <Indicador
            titulo="Activos"
            valor={activos}
          />

          <Indicador
            titulo="Inactivos"
            valor={inactivos}
          />
        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

          <h2 className="text-2xl font-black">
            Registrar trabajador
          </h2>

          <p className="mt-1 text-sm text-neutral-600">
            Registra manualmente un trabajador.
            Posteriormente habilitaremos la carga
            masiva desde Excel.
          </p>

          <form
            onSubmit={registrarTrabajador}
            className="mt-7 space-y-7"
          >

            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-wide">
                Información general
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <Campo
                  label="Identificación *"
                  value={form.identificacion}
                  placeholder="Ej. 1098765432"
                  onChange={(v) =>
                    actualizarCampo(
                      "identificacion",
                      v
                    )
                  }
                />

                <Campo
                  label="Nombres *"
                  value={form.nombres}
                  placeholder="Ej. Juan Carlos"
                  onChange={(v) =>
                    actualizarCampo(
                      "nombres",
                      v
                    )
                  }
                />

                <Campo
                  label="Apellidos *"
                  value={form.apellidos}
                  placeholder="Ej. Pérez Gómez"
                  onChange={(v) =>
                    actualizarCampo(
                      "apellidos",
                      v
                    )
                  }
                />

                <Campo
                  label="Cargo"
                  value={form.cargo}
                  placeholder="Ej. Operador de Cementación"
                  onChange={(v) =>
                    actualizarCampo(
                      "cargo",
                      v
                    )
                  }
                />

                <Campo
                  label="Área / operación"
                  value={form.area_operacion}
                  placeholder="Ej. Well Services"
                  onChange={(v) =>
                    actualizarCampo(
                      "area_operacion",
                      v
                    )
                  }
                />

                <Campo
                  label="Base habitual"
                  value={form.base}
                  placeholder="Ej. Base Palermo"
                  onChange={(v) =>
                    actualizarCampo(
                      "base",
                      v
                    )
                  }
                />

                <Campo
                  label="Empresa"
                  value={form.empresa}
                  placeholder="Empresa"
                  onChange={(v) =>
                    actualizarCampo(
                      "empresa",
                      v
                    )
                  }
                />

                <Campo
                  label="Fecha de ingreso"
                  type="date"
                  value={form.fecha_ingreso}
                  onChange={(v) =>
                    actualizarCampo(
                      "fecha_ingreso",
                      v
                    )
                  }
                />

              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">

              <h3 className="text-sm font-black uppercase tracking-wide">
                Tallas del trabajador
              </h3>

              <p className="mt-1 text-xs text-neutral-500">
                Estas tallas servirán posteriormente
                para sugerir automáticamente el EPP
                adecuado durante una entrega.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <Campo
                  label="Overol / camisa"
                  value={form.talla_overol}
                  placeholder="Ej. M, L, 36"
                  onChange={(v) =>
                    actualizarCampo(
                      "talla_overol",
                      v
                    )
                  }
                />

                <Campo
                  label="Pantalón"
                  value={form.talla_pantalon}
                  placeholder="Ej. 34"
                  onChange={(v) =>
                    actualizarCampo(
                      "talla_pantalon",
                      v
                    )
                  }
                />

                <Campo
                  label="Calzado"
                  value={form.talla_calzado}
                  placeholder="Ej. 41"
                  onChange={(v) =>
                    actualizarCampo(
                      "talla_calzado",
                      v
                    )
                  }
                />

                <Campo
                  label="Guantes"
                  value={form.talla_guantes}
                  placeholder="Ej. L"
                  onChange={(v) =>
                    actualizarCampo(
                      "talla_guantes",
                      v
                    )
                  }
                />

              </div>
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
                placeholder="Observaciones adicionales..."
                rows={3}
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
                : "Registrar trabajador"}
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
                Trabajadores registrados
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                {trabajadoresFiltrados.length} resultados
              </p>
            </div>

            <input
              type="search"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por nombre, identificación, cargo o base..."
              className="w-full md:w-[420px] rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />

          </div>

          <div className="mt-6 overflow-x-auto">

            {cargando ? (

              <div className="py-10 text-center text-neutral-500">
                Cargando trabajadores...
              </div>

            ) : trabajadoresFiltrados.length === 0 ? (

              <div className="rounded-2xl bg-neutral-50 p-10 text-center">

                <div className="text-5xl">
                  👷
                </div>

                <p className="mt-4 font-bold">
                  No hay trabajadores registrados
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  Registra el primer trabajador
                  utilizando el formulario superior.
                </p>

              </div>

            ) : (

              <table className="w-full min-w-[1200px] text-sm">

                <thead>
                  <tr className="border-b text-left">

                    <th className="py-3 pr-4">
                      Identificación
                    </th>

                    <th className="py-3 pr-4">
                      Trabajador
                    </th>

                    <th className="py-3 pr-4">
                      Cargo
                    </th>

                    <th className="py-3 pr-4">
                      Base habitual
                    </th>

                    <th className="py-3 pr-4">
                      Calzado
                    </th>

                    <th className="py-3 pr-4">
                      Overol
                    </th>

                    <th className="py-3 pr-4">
                      Guantes
                    </th>

                    <th className="py-3 pr-4">
                      Estado
                    </th>

                    <th className="py-3">
                      Acción
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {trabajadoresFiltrados.map(
                    (trabajador) => (

                      <tr
                        key={trabajador.id}
                        className="border-b border-neutral-100"
                      >

                        <td className="py-4 pr-4 font-semibold">
                          {trabajador.identificacion}
                        </td>

                        <td className="py-4 pr-4">

                          <div className="font-bold">
                            {trabajador.nombres}{" "}
                            {trabajador.apellidos}
                          </div>

                          <div className="mt-1 text-xs text-neutral-500">
                            {trabajador.empresa || "—"}
                          </div>

                        </td>

                        <td className="py-4 pr-4">
                          {trabajador.cargo || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {trabajador.base || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {trabajador.talla_calzado || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {trabajador.talla_overol || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {trabajador.talla_guantes || "—"}
                        </td>

                        <td className="py-4 pr-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              trabajador.estado === "ACTIVO"
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {trabajador.estado}
                          </span>

                        </td>

                       <td className="py-4">

  <div className="flex flex-col gap-2">

    <a
      href={`/control-trabajo/epp/trabajadores/${trabajador.id}`}
      className="rounded-lg bg-neutral-950 px-3 py-2 text-center text-xs font-bold text-white hover:bg-neutral-800"
    >
      Ver ficha
    </a>

    <button
      type="button"
      onClick={() =>
        cambiarEstado(
          trabajador
        )
      }
      className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold hover:bg-neutral-100"
    >
      {trabajador.estado === "ACTIVO"
        ? "Inactivar"
        : "Activar"}
    </button>

  </div>

</td>

                      </tr>

                    )
                  )}

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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block mb-2 text-sm font-bold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
      />
    </div>
  );
}