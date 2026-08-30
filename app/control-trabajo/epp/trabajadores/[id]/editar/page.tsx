"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CARGOS = [
  "GERENTE DE WELL SERVICES",
  "COORDINADOR DE INGENIERÍA",
  "COORDINADOR OPERATIVO CMT/CT",
  "INGENIERO DE WELL SERVICES",
  "INGENIERO DE LABORATORIO",
  "TÉCNICO DE LABORATORIO",
  "SUPERVISOR HSEQ",
  "SUPERVISOR DE WELL SERVICES",
  "OPERADOR DE WELL SERVICES",
  "AYUDANTE DE WELL SERVICES",
  "SOLDADOR",
  "ELECTROMECÁNICO",
  "ALMACENISTA",
];

const BASES = [
  "BASE TOCANCIPA",
  "BASE PALERMO",
  "PATIO LA FLORIDA",
  "PATIO APIAY",
];

const formularioInicial = {
  identificacion: "",
  nombres: "",
  apellidos: "",
  cargo: "",
  area_operacion: "",
  base: "",
  empresa: "",
  fecha_ingreso: "",
  talla_overol: "",
  talla_pantalon: "",
  talla_calzado: "",
  talla_guantes: "",
  observaciones: "",
};

export default function EditarTrabajadorPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [form, setForm] = useState(formularioInicial);

  const [otroCargo, setOtroCargo] = useState("");
  const [otraBase, setOtraBase] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarTrabajador() {
      setCargando(true);
      setError("");

      const { data, error } = await supabase
        .from("epp_trabajadores")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error(error);
        setError("No fue posible consultar la información del trabajador.");
        setCargando(false);
        return;
      }

      const cargoRegistrado = data.cargo || "";
      const baseRegistrada = data.base || "";

      const cargoEsEstandar =
        !cargoRegistrado || CARGOS.includes(cargoRegistrado);

      const baseEsEstandar =
        !baseRegistrada || BASES.includes(baseRegistrada);

      setForm({
        identificacion: data.identificacion || "",
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",

        cargo: cargoEsEstandar ? cargoRegistrado : "OTRO",

        area_operacion: data.area_operacion || "",

        base: baseEsEstandar ? baseRegistrada : "OTRO",

        empresa:
          data.empresa ||
          "Estrella International Energy Services",

        fecha_ingreso: data.fecha_ingreso || "",

        talla_overol: data.talla_overol || "",
        talla_pantalon: data.talla_pantalon || "",
        talla_calzado: data.talla_calzado || "",
        talla_guantes: data.talla_guantes || "",

        observaciones: data.observaciones || "",
      });

      if (!cargoEsEstandar) {
        setOtroCargo(cargoRegistrado);
      }

      if (!baseEsEstandar) {
        setOtraBase(baseRegistrada);
      }

      setCargando(false);
    }

    if (id) {
      cargarTrabajador();
    }
  }, [id]);

  function actualizarCampo(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function guardarCambios(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (!form.identificacion.trim()) {
      setError("Debes ingresar la identificación.");
      return;
    }

    if (!form.nombres.trim()) {
      setError("Debes ingresar los nombres.");
      return;
    }

    if (!form.apellidos.trim()) {
      setError("Debes ingresar los apellidos.");
      return;
    }

    if (!form.cargo) {
      setError("Debes seleccionar el cargo.");
      return;
    }

    if (form.cargo === "OTRO" && !otroCargo.trim()) {
      setError("Debes indicar cuál es el cargo.");
      return;
    }

    if (!form.base) {
      setError("Debes seleccionar la base habitual.");
      return;
    }

    if (form.base === "OTRO" && !otraBase.trim()) {
      setError("Debes indicar cuál base o patio.");
      return;
    }

    setGuardando(true);

    const trabajadorActualizado = {
      identificacion: form.identificacion.trim(),

      nombres: form.nombres.trim().toUpperCase(),

      apellidos: form.apellidos.trim().toUpperCase(),

      cargo:
        form.cargo === "OTRO"
          ? otroCargo.trim().toUpperCase()
          : form.cargo,

      area_operacion:
        form.area_operacion.trim() || null,

      base:
        form.base === "OTRO"
          ? otraBase.trim().toUpperCase()
          : form.base,

      empresa:
        form.empresa.trim() ||
        "Estrella International Energy Services",

      // Estos datos pueden permanecer vacíos
      // y completarse posteriormente.
      fecha_ingreso:
        form.fecha_ingreso || null,

      talla_overol:
        form.talla_overol.trim().toUpperCase() || null,

      talla_pantalon:
        form.talla_pantalon.trim().toUpperCase() || null,

      talla_calzado:
        form.talla_calzado.trim().toUpperCase() || null,

      talla_guantes:
        form.talla_guantes.trim().toUpperCase() || null,

      observaciones:
        form.observaciones.trim() || null,

      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("epp_trabajadores")
      .update(trabajadorActualizado)
      .eq("id", id);

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setError(
          "Ya existe otro trabajador con esa identificación."
        );
      } else {
        setError(
          `No fue posible guardar los cambios: ${error.message}`
        );
      }

      setGuardando(false);
      return;
    }

    setMensaje("Información actualizada correctamente.");
    setGuardando(false);
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-neutral-500">
            Cargando información del trabajador...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-neutral-600 hover:text-black"
        >
          ← Volver
        </button>

        <header className="mt-5">
          <h1 className="text-4xl font-black tracking-tight">
            Editar trabajador
          </h1>

          <p className="mt-2 text-neutral-600">
            Actualiza la información general, fecha de ingreso
            y tallas del trabajador.
          </p>
        </header>

        <form
          onSubmit={guardarCambios}
          className="mt-8 space-y-8"
        >

          <section className="rounded-3xl border border-neutral-200 p-6 md:p-8">

            <h2 className="text-xl font-black">
              Información general
            </h2>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">

              <Campo
                label="Identificación *"
                value={form.identificacion}
                onChange={(v) =>
                  actualizarCampo("identificacion", v)
                }
              />

              <Campo
                label="Nombres *"
                value={form.nombres}
                onChange={(v) =>
                  actualizarCampo("nombres", v)
                }
              />

              <Campo
                label="Apellidos *"
                value={form.apellidos}
                onChange={(v) =>
                  actualizarCampo("apellidos", v)
                }
              />

              <div>
                <label className="block mb-2 text-sm font-bold">
                  Cargo *
                </label>

                <select
                  value={form.cargo}
                  onChange={(e) => {
                    actualizarCampo("cargo", e.target.value);

                    if (e.target.value !== "OTRO") {
                      setOtroCargo("");
                    }
                  }}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                >
                  <option value="">Seleccione un cargo</option>

                  {CARGOS.map((cargo) => (
                    <option key={cargo} value={cargo}>
                      {cargo}
                    </option>
                  ))}

                  <option value="OTRO">OTRO</option>
                </select>

                {form.cargo === "OTRO" && (
                  <input
                    type="text"
                    value={otroCargo}
                    onChange={(e) =>
                      setOtroCargo(e.target.value)
                    }
                    placeholder="¿Cuál cargo?"
                    className="mt-3 w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                )}
              </div>

              <Campo
                label="Área / operación"
                value={form.area_operacion}
                onChange={(v) =>
                  actualizarCampo("area_operacion", v)
                }
              />

              <div>
                <label className="block mb-2 text-sm font-bold">
                  Base habitual *
                </label>

                <select
                  value={form.base}
                  onChange={(e) => {
                    actualizarCampo("base", e.target.value);

                    if (e.target.value !== "OTRO") {
                      setOtraBase("");
                    }
                  }}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                >
                  <option value="">
                    Seleccione una base o patio
                  </option>

                  {BASES.map((base) => (
                    <option key={base} value={base}>
                      {base}
                    </option>
                  ))}

                  <option value="OTRO">OTRO</option>
                </select>

                {form.base === "OTRO" && (
                  <input
                    type="text"
                    value={otraBase}
                    onChange={(e) =>
                      setOtraBase(e.target.value)
                    }
                    placeholder="¿Cuál base o patio?"
                    className="mt-3 w-full rounded-xl border border-neutral-300 px-4 py-3"
                  />
                )}
              </div>

              <Campo
                label="Empresa"
                value={form.empresa}
                onChange={(v) =>
                  actualizarCampo("empresa", v)
                }
              />

              <Campo
                label="Fecha de ingreso"
                type="date"
                value={form.fecha_ingreso}
                onChange={(v) =>
                  actualizarCampo("fecha_ingreso", v)
                }
              />

            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">

            <h2 className="text-xl font-black">
              Tallas del trabajador
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              Estos datos son opcionales. Puedes dejarlos vacíos
              y completarlos posteriormente.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              <Campo
                label="Overol / camisa"
                value={form.talla_overol}
                placeholder="Ej. M, L, 36"
                onChange={(v) =>
                  actualizarCampo("talla_overol", v)
                }
              />

              <Campo
                label="Pantalón"
                value={form.talla_pantalon}
                placeholder="Ej. 34"
                onChange={(v) =>
                  actualizarCampo("talla_pantalon", v)
                }
              />

              <Campo
                label="Calzado"
                value={form.talla_calzado}
                placeholder="Ej. 41"
                onChange={(v) =>
                  actualizarCampo("talla_calzado", v)
                }
              />

              <Campo
                label="Guantes"
                value={form.talla_guantes}
                placeholder="Ej. L"
                onChange={(v) =>
                  actualizarCampo("talla_guantes", v)
                }
              />

            </div>
          </section>

          <section>
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
              rows={4}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3"
            />
          </section>

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

          <div className="flex flex-wrap gap-3">

            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-neutral-950 px-6 py-3 font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-neutral-300 px-6 py-3 font-bold hover:bg-neutral-100"
            >
              Cancelar
            </button>

          </div>

        </form>
      </div>
    </main>
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
      />
    </div>
  );
}