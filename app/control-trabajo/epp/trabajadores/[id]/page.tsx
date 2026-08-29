"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  estado: string;
  observaciones: string | null;
};

type DetalleEntrega = {
  id: string;
  cantidad: number;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  fecha_vencimiento: string | null;
  estado_elemento: string;

  epp_catalogo?: {
    codigo: string;
    nombre: string;
    unidad_medida: string;
  } | null;
};

type Entrega = {
  id: string;
  fecha_entrega: string;
  entregado_por: string;
  recibido_por: string | null;
  motivo: string;
  observaciones: string | null;
  estado: string;
  firma_url: string | null;
  soporte_url: string | null;

  epp_ubicaciones?: {
    nombre: string;
  } | null;

  epp_entrega_detalle?: DetalleEntrega[];
};

export default function FichaTrabajadorPage() {
  const params = useParams();
  const id = params.id as string;

  const [trabajador, setTrabajador] =
    useState<Trabajador | null>(null);

  const [entregas, setEntregas] =
    useState<Entrega[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function cargarFicha() {
      setCargando(true);
      setError("");

      const [
        respuestaTrabajador,
        respuestaEntregas,
      ] = await Promise.all([
        supabase
          .from("epp_trabajadores")
          .select("*")
          .eq("id", id)
          .single(),

        supabase
          .from("epp_entregas")
          .select(`
            id,
            fecha_entrega,
            entregado_por,
            recibido_por,
            motivo,
            observaciones,
            estado,
            firma_url,
            soporte_url,

            epp_ubicaciones (
              nombre
            ),

            epp_entrega_detalle (
              id,
              cantidad,
              talla,
              lote,
              serial,
              fecha_vencimiento,
              estado_elemento,

              epp_catalogo (
                codigo,
                nombre,
                unidad_medida
              )
            )
          `)
          .eq("trabajador_id", id)
          .eq("estado", "CONFIRMADA")
          .order(
            "fecha_entrega",
            { ascending: false }
          ),
      ]);

      if (respuestaTrabajador.error) {
        console.error(
          respuestaTrabajador.error
        );

        setError(
          `No fue posible consultar el trabajador: ${respuestaTrabajador.error.message}`
        );

        setTrabajador(null);
        setCargando(false);
        return;
      }

      setTrabajador(
        respuestaTrabajador.data as Trabajador
      );

      if (respuestaEntregas.error) {
        console.error(
          respuestaEntregas.error
        );

        setError(
          `No fue posible consultar las entregas: ${respuestaEntregas.error.message}`
        );

        setEntregas([]);
      } else {
        setEntregas(
          (respuestaEntregas.data ?? []) as unknown as Entrega[]
        );
      }

      setCargando(false);
    }

    if (id) {
      cargarFicha();
    }
  }, [id]);

  const elementosEntregados =
    useMemo(() => {
      return entregas.flatMap(
        (entrega) =>
          (
            entrega.epp_entrega_detalle ??
            []
          ).map((detalle) => ({
            ...detalle,

            entrega_id:
              entrega.id,

            fecha_entrega:
              entrega.fecha_entrega,

            motivo:
              entrega.motivo,

            entregado_por:
              entrega.entregado_por,

            ubicacion:
              entrega.epp_ubicaciones
                ?.nombre ?? "—",
          }))
      );
    }, [entregas]);

  const totalUnidades =
    elementosEntregados.reduce(
      (total, item) =>
        total +
        Number(item.cantidad || 0),
      0
    );

  if (cargando) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-neutral-500">
            Cargando ficha del trabajador...
          </p>
        </div>
      </main>
    );
  }

  if (!trabajador) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">

          <a
            href="/control-trabajo/epp/trabajadores"
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a trabajadores
          </a>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error ||
              "Trabajador no encontrado."}
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">

        <header>
          <a
            href="/control-trabajo/epp/trabajadores"
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a trabajadores
          </a>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                Ficha de trabajador
              </p>

              <h1 className="mt-1 text-4xl md:text-5xl font-black tracking-tight">
                {trabajador.nombres}{" "}
                {trabajador.apellidos}
              </h1>

              <p className="mt-2 text-neutral-600">
                {trabajador.identificacion}

                {trabajador.cargo
                  ? ` · ${trabajador.cargo}`
                  : ""}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black ${
                trabajador.estado ===
                "ACTIVO"
                  ? "bg-green-100 text-green-700"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {trabajador.estado}
            </span>

          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <Indicador
            titulo="Entregas registradas"
            valor={entregas.length}
          />

          <Indicador
            titulo="Unidades entregadas"
            valor={totalUnidades}
          />

          <Indicador
            titulo="Registros de EPP"
            valor={
              elementosEntregados.length
            }
          />

        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

          <h2 className="text-2xl font-black">
            Información general
          </h2>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <Dato
              titulo="Identificación"
              valor={
                trabajador.identificacion
              }
            />

            <Dato
              titulo="Cargo"
              valor={trabajador.cargo}
            />

            <Dato
              titulo="Área / operación"
              valor={
                trabajador.area_operacion
              }
            />

            <Dato
              titulo="Base habitual"
              valor={trabajador.base}
            />

            <Dato
              titulo="Empresa"
              valor={trabajador.empresa}
            />

            <Dato
              titulo="Fecha de ingreso"
              valor={formatearFecha(
                trabajador.fecha_ingreso
              )}
            />

          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

          <h2 className="text-2xl font-black">
            Tallas registradas
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Información utilizada para
            seleccionar el EPP adecuado
            durante las entregas.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">

            <Talla
              titulo="Overol / camisa"
              valor={
                trabajador.talla_overol
              }
            />

            <Talla
              titulo="Pantalón"
              valor={
                trabajador.talla_pantalon
              }
            />

            <Talla
              titulo="Calzado"
              valor={
                trabajador.talla_calzado
              }
            />

            <Talla
              titulo="Guantes"
              valor={
                trabajador.talla_guantes
              }
            />

          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

          <div>
            <h2 className="text-2xl font-black">
              EPP asignados
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Elementos entregados al
              trabajador registrados en el
              sistema.
            </p>
          </div>

          {elementosEntregados.length ===
          0 ? (

            <div className="mt-6 rounded-2xl bg-neutral-50 p-10 text-center">

              <div className="text-4xl">
                🦺
              </div>

              <p className="mt-3 font-bold">
                Sin EPP registrados
              </p>

              <p className="mt-1 text-sm text-neutral-500">
                Todavía no existen entregas
                confirmadas para este
                trabajador.
              </p>

            </div>

          ) : (

            <div className="mt-6 overflow-x-auto">

              <table className="w-full min-w-[1050px] text-sm">

                <thead>
                  <tr className="border-b text-left">

                    <th className="py-3 pr-4">
                      EPP
                    </th>

                    <th className="py-3 pr-4">
                      Fecha
                    </th>

                    <th className="py-3 pr-4">
                      Talla
                    </th>

                    <th className="py-3 pr-4">
                      Cantidad
                    </th>

                    <th className="py-3 pr-4">
                      Lugar
                    </th>

                    <th className="py-3 pr-4">
                      Motivo
                    </th>

                    <th className="py-3 pr-4">
                      Lote / Serial
                    </th>

                    <th className="py-3">
                      Estado
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {elementosEntregados.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="border-b border-neutral-100"
                      >

                        <td className="py-4 pr-4">

                          <div className="font-black">
                            {
                              item
                                .epp_catalogo
                                ?.nombre
                            }
                          </div>

                          <div className="mt-1 text-xs text-neutral-500">
                            {
                              item
                                .epp_catalogo
                                ?.codigo
                            }
                          </div>

                        </td>

                        <td className="py-4 pr-4">
                          {formatearFecha(
                            item.fecha_entrega
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {item.talla ||
                            "No aplica"}
                        </td>

                        <td className="py-4 pr-4 font-bold">
                          {item.cantidad}
                        </td>

                        <td className="py-4 pr-4">
                          {item.ubicacion}
                        </td>

                        <td className="py-4 pr-4">
                          {formatearTexto(
                            item.motivo
                          )}
                        </td>

                        <td className="py-4 pr-4">

                          {item.lote && (
                            <div>
                              Lote:{" "}
                              {item.lote}
                            </div>
                          )}

                          {item.serial && (
                            <div>
                              Serial:{" "}
                              {item.serial}
                            </div>
                          )}

                          {!item.lote &&
                            !item.serial &&
                            "—"}

                        </td>

                        <td className="py-4">

                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                            {
                              item.estado_elemento
                            }
                          </span>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>

            </div>
          )}

        </section>

        <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

          <h2 className="text-2xl font-black">
            Historial de entregas
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Trazabilidad completa de las
            entregas registradas.
          </p>

          {entregas.length === 0 ? (

            <div className="mt-6 rounded-2xl bg-neutral-50 p-8 text-center text-neutral-500">
              No hay historial de entregas.
            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {entregas.map(
                (entrega) => (
                  <div
                    key={entrega.id}
                    className="rounded-2xl border border-neutral-200 p-5"
                  >

                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                      <div>

                        <div className="font-black">
                          {formatearFecha(
                            entrega.fecha_entrega
                          )}
                        </div>

                        <div className="mt-1 text-sm text-neutral-600">
                          {
                            entrega
                              .epp_ubicaciones
                              ?.nombre
                          }{" "}
                          ·{" "}
                          {formatearTexto(
                            entrega.motivo
                          )}
                        </div>

                      </div>

                      <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                        {entrega.estado}
                      </span>

                    </div>

                    <div className="mt-4 text-sm">

                      <span className="font-bold">
                        Entregado por:
                      </span>{" "}
                      {
                        entrega.entregado_por
                      }

                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">

                      {(
                        entrega.epp_entrega_detalle ??
                        []
                      ).map(
                        (detalle) => (
                          <span
                            key={
                              detalle.id
                            }
                            className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-semibold"
                          >
                            {
                              detalle
                                .epp_catalogo
                                ?.nombre
                            }{" "}
                            ×{" "}
                            {
                              detalle.cantidad
                            }
                          </span>
                        )
                      )}

                    </div>

                    {entrega.observaciones && (
                      <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
                        {
                          entrega.observaciones
                        }
                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {trabajador.observaciones && (
          <section className="rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">

            <h2 className="text-xl font-black">
              Observaciones del trabajador
            </h2>

            <p className="mt-3 text-neutral-600">
              {
                trabajador.observaciones
              }
            </p>

          </section>
        )}

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

function Dato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | null;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-5">

      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {titulo}
      </p>

      <p className="mt-2 font-bold">
        {valor || "—"}
      </p>

    </div>
  );
}

function Talla({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | null;
}) {
  return (
    <div className="rounded-2xl bg-neutral-950 p-5 text-white">

      <p className="text-xs text-neutral-400">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-black">
        {valor || "—"}
      </p>

    </div>
  );
}

function formatearFecha(
  fecha: string | null
) {
  if (!fecha) return "—";

  return new Date(
    `${fecha}T00:00:00`
  ).toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function formatearTexto(
  texto: string | null
) {
  if (!texto) return "—";

  return texto
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase()
    );
}