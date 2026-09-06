"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Solicitud = {
  id: string;
  fecha_solicitud: string;
  fecha_entrega_solicitada: string | null;
  motivo: string;
  estado_epp_anterior: string | null;
  justificacion: string | null;
  estado: string;
  cantidad_solicitada: number | null;
  responsable_entrega_sugerido: string | null;

  identificacion: string;
  nombres: string;
  apellidos: string;
  cargo: string | null;

  codigo_epp: string;
  nombre_epp: string;
  ubicacion: string | null;
};

type FotoReposicion = {
  id: string;
  reposicion_id: string;
  ruta_storage: string;
  nombre_archivo: string | null;
  orden: number;
  url?: string;
};

export default function AprobacionesEppPage() {
  const router = useRouter();

  const [verificando, setVerificando] = useState(true);
  const [puedeAprobar, setPuedeAprobar] = useState(false);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [fotosPorSolicitud, setFotosPorSolicitud] = useState<
    Record<string, FotoReposicion[]>
  >({});

  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState<
    Record<string, string>
  >({});

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function inicializar() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!activo) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: permiso, error: errorPermiso } =
          await supabase.rpc(
            "puede_aprobar_reposiciones_epp",
            {
              p_user_id: user.id,
            }
          );

        if (!activo) return;

        if (errorPermiso) {
          console.error(
            "Error validando permiso de aprobación:",
            errorPermiso
          );
          router.replace("/control-trabajo/epp");
          return;
        }

        if (permiso !== true) {
          router.replace("/control-trabajo/epp");
          return;
        }

        setPuedeAprobar(true);

        await cargarSolicitudes();
      } catch (err) {
        console.error("Error inicializando aprobaciones:", err);

        if (activo) {
          router.replace("/control-trabajo/epp");
        }
      } finally {
        if (activo) {
          setVerificando(false);
        }
      }
    }

    inicializar();

    return () => {
      activo = false;
    };
  }, [router]);

  async function cargarSolicitudes() {
    setCargando(true);
    setError("");

    const { data, error: errorSolicitudes } = await supabase
      .from("epp_reposiciones")
      .select(`
        id,
        fecha_solicitud,
        fecha_entrega_solicitada,
        motivo,
        estado_epp_anterior,
        justificacion,
        estado,
        cantidad_solicitada,
        responsable_entrega_sugerido,
        epp_trabajadores (
          identificacion,
          nombres,
          apellidos,
          cargo
        ),
        epp_catalogo (
          codigo,
          nombre
        ),
        epp_ubicaciones (
          nombre
        )
      `)
      .eq("estado", "PENDIENTE_APROBACION")
      .order("created_at", { ascending: false });

    if (errorSolicitudes) {
      console.error(errorSolicitudes);
      setError(
        `No fue posible consultar las solicitudes: ${errorSolicitudes.message}`
      );
      setCargando(false);
      return;
    }

    const solicitudesNormalizadas: Solicitud[] = (data ?? []).map(
      (registro: any) => ({
        id: registro.id,
        fecha_solicitud: registro.fecha_solicitud,
        fecha_entrega_solicitada:
          registro.fecha_entrega_solicitada,
        motivo: registro.motivo,
        estado_epp_anterior:
          registro.estado_epp_anterior,
        justificacion: registro.justificacion,
        estado: registro.estado,
        cantidad_solicitada:
          registro.cantidad_solicitada,
        responsable_entrega_sugerido:
          registro.responsable_entrega_sugerido,

        identificacion:
          registro.epp_trabajadores?.identificacion || "",
        nombres:
          registro.epp_trabajadores?.nombres || "",
        apellidos:
          registro.epp_trabajadores?.apellidos || "",
        cargo:
          registro.epp_trabajadores?.cargo || null,

        codigo_epp:
          registro.epp_catalogo?.codigo || "",
        nombre_epp:
          registro.epp_catalogo?.nombre || "EPP",
        ubicacion:
          registro.epp_ubicaciones?.nombre || null,
      })
    );

    setSolicitudes(solicitudesNormalizadas);

    await cargarFotos(solicitudesNormalizadas);

    setCargando(false);
  }

  async function cargarFotos(solicitudesActuales: Solicitud[]) {
    if (solicitudesActuales.length === 0) {
      setFotosPorSolicitud({});
      return;
    }

    const ids = solicitudesActuales.map(
      (solicitud) => solicitud.id
    );

    const { data, error: errorFotos } = await supabase
      .from("epp_reposiciones_fotos")
      .select(
        "id,reposicion_id,ruta_storage,nombre_archivo,orden"
      )
      .in("reposicion_id", ids)
      .order("orden", { ascending: true });

    if (errorFotos) {
      console.error(errorFotos);
      return;
    }

    const agrupadas: Record<string, FotoReposicion[]> = {};

    for (const foto of data ?? []) {
      const { data: firma, error: errorFirma } =
        await supabase.storage
          .from("epp-reposiciones")
          .createSignedUrl(foto.ruta_storage, 3600);

      if (errorFirma) {
        console.error(
          "Error generando URL firmada:",
          errorFirma
        );
      }

      const fotoConUrl: FotoReposicion = {
        ...foto,
        url: firma?.signedUrl,
      };

      if (!agrupadas[foto.reposicion_id]) {
        agrupadas[foto.reposicion_id] = [];
      }

      agrupadas[foto.reposicion_id].push(fotoConUrl);
    }

    setFotosPorSolicitud(agrupadas);
  }

  async function aprobarSolicitud(id: string) {
    setMensaje("");
    setError("");
    setProcesandoId(id);

    const { data, error: errorAprobacion } =
      await supabase.rpc(
        "aprobar_reposicion_epp",
        {
          p_reposicion_id: id,
        }
      );

    if (errorAprobacion) {
      console.error(errorAprobacion);
      setError(
        `No fue posible aprobar la solicitud: ${errorAprobacion.message}`
      );
      setProcesandoId("");
      return;
    }

    setMensaje(
      `Solicitud aprobada correctamente. ID: ${data}`
    );

    await cargarSolicitudes();

    setProcesandoId("");
  }

  async function rechazarSolicitud(id: string) {
    setMensaje("");
    setError("");

    const observacion =
      motivoRechazo[id]?.trim() || "";

    if (!observacion) {
      setError(
        "Debes escribir el motivo del rechazo antes de continuar."
      );
      return;
    }

    setProcesandoId(id);

    const { data, error: errorRechazo } =
      await supabase.rpc(
        "rechazar_reposicion_epp",
        {
          p_reposicion_id: id,
          p_observaciones: observacion,
        }
      );

    if (errorRechazo) {
      console.error(errorRechazo);
      setError(
        `No fue posible rechazar la solicitud: ${errorRechazo.message}`
      );
      setProcesandoId("");
      return;
    }

    setMensaje(
      `Solicitud rechazada correctamente. ID: ${data}`
    );

    setMotivoRechazo((anteriores) => ({
      ...anteriores,
      [id]: "",
    }));

    await cargarSolicitudes();

    setProcesandoId("");
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="font-semibold text-neutral-600">
          Validando permiso de aprobación...
        </p>
      </main>
    );
  }

  if (!puedeAprobar) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <header>
          <a
            href="/control-trabajo/epp"
            className="text-sm text-neutral-600 hover:text-neutral-950"
          >
            ← Volver a Gestión de EPP
          </a>

          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
            Aprobaciones de reposiciones
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-600">
            Revisa las solicitudes de reposición de EPP que
            requieren autorización previa.
          </p>
        </header>

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

        {cargando ? (
          <div className="rounded-3xl border border-neutral-200 p-10 text-center text-neutral-500">
            Cargando solicitudes...
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 p-10 text-center">
            <div className="text-4xl">✅</div>

            <h2 className="mt-4 text-xl font-black">
              No hay solicitudes pendientes
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              En este momento no existen reposiciones pendientes
              de aprobación.
            </p>
          </div>
        ) : (
          <section className="space-y-6">
            {solicitudes.map((solicitud) => {
              const fotos =
                fotosPorSolicitud[solicitud.id] ?? [];

              return (
                <article
                  key={solicitud.id}
                  className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                        PENDIENTE DE APROBACIÓN
                      </div>

                      <h2 className="mt-4 text-2xl font-black">
                        {solicitud.codigo_epp} -{" "}
                        {solicitud.nombre_epp}
                      </h2>

                      <p className="mt-1 text-sm text-neutral-600">
                        {solicitud.nombres}{" "}
                        {solicitud.apellidos} · CC{" "}
                        {solicitud.identificacion}
                      </p>
                    </div>

                    <div className="text-sm text-neutral-500">
                      Solicitud:{" "}
                      {solicitud.fecha_solicitud || "—"}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Dato
                      titulo="Cargo"
                      valor={solicitud.cargo || "—"}
                    />

                    <Dato
                      titulo="Ubicación"
                      valor={solicitud.ubicacion || "—"}
                    />

                    <Dato
                      titulo="Cantidad"
                      valor={String(
                        solicitud.cantidad_solicitada ?? 0
                      )}
                    />

                    <Dato
                      titulo="Motivo de reposición"
                      valor={solicitud.motivo || "—"}
                    />

                    <Dato
                      titulo="Estado EPP anterior"
                      valor={
                        solicitud.estado_epp_anterior || "—"
                      }
                    />

                    <Dato
                      titulo="Fecha solicitada de entrega"
                      valor={
                        solicitud.fecha_entrega_solicitada ||
                        "—"
                      }
                    />

                    <Dato
                      titulo="Responsable sugerido"
                      valor={
                        solicitud.responsable_entrega_sugerido ||
                        "—"
                      }
                    />
                  </div>

                  <div className="mt-6 rounded-2xl bg-neutral-50 p-5">
                    <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                      Justificación
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                      {solicitud.justificacion || "—"}
                    </p>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-black">
                      Evidencia fotográfica
                    </h3>

                    {fotos.length === 0 ? (
                      <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Esta solicitud no tiene fotografías
                        registradas.
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fotos.map((foto) => (
                          <div
                            key={foto.id}
                            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                          >
                            {foto.url ? (
                              <a
                                href={foto.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={foto.url}
                                  alt={`Evidencia ${foto.orden}`}
                                  className="h-56 w-full object-cover"
                                />
                              </a>
                            ) : (
                              <div className="flex h-56 items-center justify-center bg-neutral-100 text-sm text-neutral-500">
                                No fue posible cargar la imagen
                              </div>
                            )}

                            <div className="px-4 py-3 text-sm font-semibold">
                              Foto {foto.orden}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 border-t border-neutral-200 pt-6">
                    <label className="mb-2 block text-sm font-bold">
                      Motivo del rechazo
                    </label>

                    <textarea
                      value={
                        motivoRechazo[solicitud.id] || ""
                      }
                      onChange={(e) =>
                        setMotivoRechazo((anteriores) => ({
                          ...anteriores,
                          [solicitud.id]: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Solo es obligatorio si la solicitud será rechazada..."
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3"
                    />

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          rechazarSolicitud(solicitud.id)
                        }
                        disabled={
                          procesandoId === solicitud.id
                        }
                        className="rounded-xl border border-red-300 bg-white px-5 py-3 font-black text-red-700 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        Rechazar solicitud
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          aprobarSolicitud(solicitud.id)
                        }
                        disabled={
                          procesandoId === solicitud.id
                        }
                        className="rounded-xl bg-neutral-950 px-5 py-3 font-black text-white transition hover:bg-neutral-800 disabled:opacity-40"
                      >
                        {procesandoId === solicitud.id
                          ? "Procesando..."
                          : "Aprobar solicitud"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
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
    <div className="rounded-2xl border border-neutral-200 p-4">
      <div className="text-xs text-neutral-500">
        {titulo}
      </div>

      <div className="mt-1 font-semibold">
        {valor}
      </div>
    </div>
  );
}