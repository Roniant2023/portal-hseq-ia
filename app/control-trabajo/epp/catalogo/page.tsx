"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Epp = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  marca: string | null;
  modelo: string | null;
  norma_certificacion: string | null;
  requiere_talla: boolean;
  requiere_serial: boolean;
  requiere_lote: boolean;
  requiere_vencimiento: boolean;
  vida_util_meses: number | null;
  costo_referencia: number | null;
  stock_minimo: number;
  unidad_medida: string;
  activo: boolean;
};

type TallaEpp = {
  id: string;
  epp_id: string;
  talla: string;
  orden: number;
  activo: boolean;
};

const categorias = [
  "Protección de cabeza",
  "Protección visual",
  "Protección auditiva",
  "Protección respiratoria",
  "Protección de manos",
  "Protección de pies",
  "Protección corporal",
  "Protección contra caídas",
  "Otros",
];

export default function CatalogoEppPage() {
  const [epp, setEpp] = useState<Epp[]>([]);
  const [tallas, setTallas] = useState<TallaEpp[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    marca: "",
    modelo: "",
    norma_certificacion: "",
    vida_util_meses: "",
    descripcion: "",

    requiere_talla: false,
    tallas_disponibles: "",

    requiere_serial: false,
    requiere_lote: false,
    requiere_vencimiento: false,

    costo_referencia: "",
    stock_minimo: "0",
    unidad_medida: "Unidad",
  });

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [
      { data: catalogoData, error: catalogoError },
      { data: tallasData, error: tallasError },
    ] = await Promise.all([
      supabase
        .from("epp_catalogo")
        .select("*")
        .order("nombre", { ascending: true }),

      supabase
        .from("epp_tallas")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true }),
    ]);

    if (catalogoError) {
      console.error(catalogoError);

      setError(
        `Error al consultar el catálogo: ${catalogoError.message}`
      );
    } else {
      setEpp((catalogoData ?? []) as Epp[]);
    }

    if (tallasError) {
      console.error(tallasError);
    } else {
      setTallas((tallasData ?? []) as TallaEpp[]);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function actualizarCampo(
    campo: keyof typeof form,
    valor: string | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function obtenerTallas(eppId: string) {
    return tallas
      .filter((item) => item.epp_id === eppId)
      .map((item) => item.talla);
  }

  async function registrarEpp(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (!form.codigo.trim()) {
      setError("Debes ingresar el código del EPP.");
      return;
    }

    if (!form.nombre.trim()) {
      setError("Debes ingresar el nombre del EPP.");
      return;
    }

    if (!form.categoria) {
      setError("Debes seleccionar una categoría.");
      return;
    }

    if (
      form.requiere_talla &&
      !form.tallas_disponibles.trim()
    ) {
      setError(
        "El EPP requiere talla. Debes ingresar al menos una talla."
      );
      return;
    }

    setGuardando(true);

    const nuevoEpp = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim().toUpperCase(),
      categoria: form.categoria,

      descripcion:
        form.descripcion.trim() || null,

      marca:
        form.marca.trim() || null,

      modelo:
        form.modelo.trim() || null,

      norma_certificacion:
        form.norma_certificacion.trim() || null,

      requiere_talla:
        form.requiere_talla,

      requiere_serial:
        form.requiere_serial,

      requiere_lote:
        form.requiere_lote,

      requiere_vencimiento:
        form.requiere_vencimiento,

      vida_util_meses:
        form.vida_util_meses
          ? Number(form.vida_util_meses)
          : null,

      costo_referencia:
        form.costo_referencia
          ? Number(form.costo_referencia)
          : null,

      stock_minimo:
        form.stock_minimo
          ? Number(form.stock_minimo)
          : 0,

      unidad_medida:
        form.unidad_medida || "Unidad",

      activo: true,
    };

    const {
      data: eppCreado,
      error: errorEpp,
    } = await supabase
      .from("epp_catalogo")
      .insert(nuevoEpp)
      .select("id")
      .single();

    if (errorEpp) {
      console.error(errorEpp);

      setError(
        `No fue posible guardar el EPP: ${errorEpp.message}`
      );

      setGuardando(false);
      return;
    }

    if (
      form.requiere_talla &&
      eppCreado?.id
    ) {
      const tallasProcesadas = Array.from(
        new Set(
          form.tallas_disponibles
            .split(",")
            .map((item) =>
              item.trim().toUpperCase()
            )
            .filter(Boolean)
        )
      );

      const registrosTalla =
        tallasProcesadas.map(
          (talla, index) => ({
            epp_id: eppCreado.id,
            talla,
            orden: index + 1,
            activo: true,
          })
        );

      const { error: errorTallas } =
        await supabase
          .from("epp_tallas")
          .insert(registrosTalla);

      if (errorTallas) {
        console.error(errorTallas);

        setError(
          `El EPP fue creado, pero ocurrió un error registrando las tallas: ${errorTallas.message}`
        );

        setGuardando(false);

        await cargarDatos();
        return;
      }
    }

    setMensaje(
      "EPP registrado correctamente."
    );

    setForm({
      codigo: "",
      nombre: "",
      categoria: "",
      marca: "",
      modelo: "",
      norma_certificacion: "",
      vida_util_meses: "",
      descripcion: "",

      requiere_talla: false,
      tallas_disponibles: "",

      requiere_serial: false,
      requiere_lote: false,
      requiere_vencimiento: false,

      costo_referencia: "",
      stock_minimo: "0",
      unidad_medida: "Unidad",
    });

    await cargarDatos();

    setGuardando(false);
  }

  const total = epp.length;

  const activos =
    epp.filter(
      (item) => item.activo
    ).length;

  const inactivos =
    total - activos;

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

        <header>
          <a
  href="/control-trabajo/epp/inventario"
  className="text-sm text-neutral-600 hover:text-black"
>
  ← Volver a Inventario
</a>

          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
            Catálogo de EPP
          </h1>

          <p className="mt-2 text-neutral-600">
            Administración de los elementos
            de protección personal utilizados
            en las operaciones.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <Indicador
            titulo="EPP registrados"
            valor={total}
          />

          <Indicador
            titulo="EPP activos"
            valor={activos}
          />

          <Indicador
            titulo="Inactivos"
            valor={inactivos}
          />

        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

          <h2 className="text-2xl font-black">
            Registrar nuevo EPP
          </h2>

          <p className="mt-1 text-sm text-neutral-600">
            Agrega manualmente un elemento
            al catálogo.
          </p>

          <form
            onSubmit={registrarEpp}
            className="mt-7 space-y-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <Campo
                label="Código *"
                value={form.codigo}
                placeholder="Ej. EPP-001"
                onChange={(v) =>
                  actualizarCampo(
                    "codigo",
                    v
                  )
                }
              />

              <Campo
                label="Nombre *"
                value={form.nombre}
                placeholder="Ej. Casco de seguridad"
                onChange={(v) =>
                  actualizarCampo(
                    "nombre",
                    v
                  )
                }
              />

              <div>
                <label className="block mb-2 text-sm font-bold">
                  Categoría *
                </label>

                <select
                  value={form.categoria}
                  onChange={(e) =>
                    actualizarCampo(
                      "categoria",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                >
                  <option value="">
                    Seleccionar...
                  </option>

                  {categorias.map(
                    (categoria) => (
                      <option
                        key={categoria}
                        value={categoria}
                      >
                        {categoria}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Campo
                label="Marca"
                value={form.marca}
                placeholder="Ej. MSA"
                onChange={(v) =>
                  actualizarCampo(
                    "marca",
                    v
                  )
                }
              />

              <Campo
                label="Referencia / modelo"
                value={form.modelo}
                placeholder="Ej. V-Gard"
                onChange={(v) =>
                  actualizarCampo(
                    "modelo",
                    v
                  )
                }
              />

              <Campo
                label="Norma / certificación"
                value={
                  form.norma_certificacion
                }
                placeholder="Ej. ANSI Z89.1"
                onChange={(v) =>
                  actualizarCampo(
                    "norma_certificacion",
                    v
                  )
                }
              />

              <Campo
                label="Vida útil (meses)"
                type="number"
                value={
                  form.vida_util_meses
                }
                placeholder="Ej. 60"
                onChange={(v) =>
                  actualizarCampo(
                    "vida_util_meses",
                    v
                  )
                }
              />

              <Campo
                label="Costo de referencia"
                type="number"
                value={
                  form.costo_referencia
                }
                placeholder="Ej. 85000"
                onChange={(v) =>
                  actualizarCampo(
                    "costo_referencia",
                    v
                  )
                }
              />

              <Campo
                label="Stock mínimo"
                type="number"
                value={
                  form.stock_minimo
                }
                placeholder="0"
                onChange={(v) =>
                  actualizarCampo(
                    "stock_minimo",
                    v
                  )
                }
              />

              <div>
                <label className="block mb-2 text-sm font-bold">
                  Unidad de medida
                </label>

                <select
                  value={
                    form.unidad_medida
                  }
                  onChange={(e) =>
                    actualizarCampo(
                      "unidad_medida",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                >
                  <option value="Unidad">
                    Unidad
                  </option>

                  <option value="Par">
                    Par
                  </option>

                  <option value="Juego">
                    Juego
                  </option>

                  <option value="Caja">
                    Caja
                  </option>
                </select>
              </div>

            </div>

            <div>
              <label className="block mb-2 text-sm font-bold">
                Descripción
              </label>

              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  actualizarCampo(
                    "descripcion",
                    e.target.value
                  )
                }
                placeholder="Descripción del elemento..."
                rows={3}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">
                Control requerido para este EPP
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                <Check
                  label="Requiere talla"
                  checked={
                    form.requiere_talla
                  }
                  onChange={(v) =>
                    actualizarCampo(
                      "requiere_talla",
                      v
                    )
                  }
                />

                <Check
                  label="Requiere serial"
                  checked={
                    form.requiere_serial
                  }
                  onChange={(v) =>
                    actualizarCampo(
                      "requiere_serial",
                      v
                    )
                  }
                />

                <Check
                  label="Requiere lote"
                  checked={
                    form.requiere_lote
                  }
                  onChange={(v) =>
                    actualizarCampo(
                      "requiere_lote",
                      v
                    )
                  }
                />

                <Check
                  label="Controla vencimiento"
                  checked={
                    form.requiere_vencimiento
                  }
                  onChange={(v) =>
                    actualizarCampo(
                      "requiere_vencimiento",
                      v
                    )
                  }
                />

              </div>
            </div>

            {form.requiere_talla && (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">

                <label className="block text-sm font-bold">
                  Tallas disponibles *
                </label>

                <p className="mt-1 text-xs text-neutral-500">
                  Escribe las tallas separadas por coma.
                </p>

                <input
                  type="text"
                  value={
                    form.tallas_disponibles
                  }
                  onChange={(e) =>
                    actualizarCampo(
                      "tallas_disponibles",
                      e.target.value
                    )
                  }
                  placeholder="Ej. S, M, L, XL o 38, 39, 40, 41"
                  className="mt-3 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-black"
                />

                <div className="mt-3 text-xs text-neutral-500">
                  Ejemplos:
                  {" "}
                  Guantes → S, M, L, XL
                  {" · "}
                  Botas → 38, 39, 40, 41, 42
                </div>

              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-neutral-950 px-6 py-3 font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : "Registrar EPP"}
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

          <h2 className="text-2xl font-black">
            EPP registrados
          </h2>

          <p className="mt-1 text-sm text-neutral-600">
            Catálogo actualmente almacenado
            en Supabase.
          </p>

          <div className="mt-6 overflow-x-auto">

            {cargando ? (

              <p className="text-sm text-neutral-500">
                Cargando catálogo...
              </p>

            ) : epp.length === 0 ? (

              <div className="rounded-2xl bg-neutral-50 p-8 text-center text-neutral-500">
                Todavía no hay EPP registrados.
              </div>

            ) : (

              <table className="w-full min-w-[1050px] text-sm">

                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">
                      Código
                    </th>

                    <th className="py-3 pr-4">
                      EPP
                    </th>

                    <th className="py-3 pr-4">
                      Categoría
                    </th>

                    <th className="py-3 pr-4">
                      Marca
                    </th>

                    <th className="py-3 pr-4">
                      Modelo
                    </th>

                    <th className="py-3 pr-4">
                      Tallas
                    </th>

                    <th className="py-3 pr-4">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {epp.map((item) => {
                    const tallasItem =
                      obtenerTallas(
                        item.id
                      );

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-neutral-100"
                      >

                        <td className="py-4 pr-4 font-semibold">
                          {item.codigo}
                        </td>

                        <td className="py-4 pr-4 font-bold">
                          {item.nombre}
                        </td>

                        <td className="py-4 pr-4">
                          {item.categoria}
                        </td>

                        <td className="py-4 pr-4">
                          {item.marca || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.modelo || "—"}
                        </td>

                        <td className="py-4 pr-4">
                          {item.requiere_talla
                            ? tallasItem.length
                              ? tallasItem.join(", ")
                              : "Sin tallas"
                            : "No aplica"}
                        </td>

                        <td className="py-4 pr-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              item.activo
                                ? "bg-green-100 text-green-700"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {item.activo
                              ? "ACTIVO"
                              : "INACTIVO"}
                          </span>

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

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-4">

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="h-5 w-5"
      />

      <span className="text-sm font-semibold">
        {label}
      </span>

    </label>
  );
}