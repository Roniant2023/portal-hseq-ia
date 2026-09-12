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
type HallazgoIA = {
  tipo?: string;
  descripcion?: string;
  imagen_referencia?: string;
};

type AnalisisIA = {
  id: string;
  reposicion_id: string;
  modelo: string;
  resumen: string | null;
  hallazgos: HallazgoIA[] | null;
  severidad_visible: string | null;
  calidad_evidencia: string | null;
  consistencia_imagenes: string | null;
  evaluacion_soporte: string | null;
  recomendacion_apoyo: string | null;
  advertencias: string | null;
  created_at: string;
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

const [analizandoId, setAnalizandoId] = useState("");

const [analisisPorSolicitud, setAnalisisPorSolicitud] = useState<
  Record<string, AnalisisIA>
>({});

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

await Promise.all([
  cargarFotos(solicitudesNormalizadas),
  cargarAnalisis(solicitudesNormalizadas),
]);

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
async function cargarAnalisis(
  solicitudesActuales: Solicitud[]
) {
  if (solicitudesActuales.length === 0) {
    setAnalisisPorSolicitud({});
    return;
  }

  const ids = solicitudesActuales.map(
    (solicitud) => solicitud.id
  );

  const { data, error: errorAnalisis } = await supabase
    .from("epp_reposiciones_analisis_ia")
    .select(`
      id,
      reposicion_id,
      modelo,
      resumen,
      hallazgos,
      severidad_visible,
      calidad_evidencia,
      consistencia_imagenes,
      evaluacion_soporte,
      recomendacion_apoyo,
      advertencias,
      created_at
    `)
    .in("reposicion_id", ids)
    .order("created_at", { ascending: false });

  if (errorAnalisis) {
    console.error(
      "Error consultando análisis IA:",
      errorAnalisis
    );
    return;
  }

  const porSolicitud: Record<string, AnalisisIA> = {};

  for (const registro of data ?? []) {
    if (!porSolicitud[registro.reposicion_id]) {
      porSolicitud[registro.reposicion_id] =
        registro as AnalisisIA;
    }
  }

  setAnalisisPorSolicitud(porSolicitud);
}
async function analizarConIA(id: string) {
  setMensaje("");
  setError("");
  setAnalizandoId(id);

  try {
    const { data: sesionData, error: sesionError } =
      await supabase.auth.getSession();

    if (
      sesionError ||
      !sesionData.session?.access_token
    ) {
      setError(
        "No fue posible validar la sesión para realizar el análisis con IA."
      );
      return;
    }

    const respuesta = await fetch(
      "/api/reposiciones/analizar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sesionData.session.access_token}`,
        },
        body: JSON.stringify({
          reposicion_id: id,
        }),
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setError(
        resultado?.error ||
          "No fue posible realizar el análisis con IA."
      );
      return;
    }

    if (resultado?.analisis) {
      setAnalisisPorSolicitud((anteriores) => ({
        ...anteriores,
        [id]: resultado.analisis as AnalisisIA,
      }));
    }

    setMensaje(
      "Análisis asistido por IA generado correctamente. La decisión continúa siendo exclusivamente del aprobador humano."
    );
  } catch (err) {
    console.error(
      "Error analizando reposición con IA:",
      err
    );

    setError(
      "Ocurrió un error inesperado durante el análisis con IA."
    );
  } finally {
    setAnalizandoId("");
  }
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

  const analisis =
    analisisPorSolicitud[solicitud.id];

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
                  <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-blue-950">
                          Análisis asistido por IA
                        </h3>

                        <p className="mt-1 text-sm leading-relaxed text-blue-800">
                          La IA analiza únicamente la evidencia visual como
                          apoyo al aprobador. No aprueba ni rechaza la solicitud
                          y no reemplaza la evaluación humana.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          analizarConIA(solicitud.id)
                        }
                        disabled={
                          fotos.length < 3 ||
                          analizandoId === solicitud.id ||
                          procesandoId === solicitud.id
                        }
                        className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {analizandoId === solicitud.id
                          ? "Analizando imágenes..."
                          : analisis
                            ? "Analizar nuevamente"
                            : "Analizar con IA"}
                      </button>
                    </div>

                    {fotos.length < 3 && (
                      <p className="mt-3 text-sm font-semibold text-amber-700">
                        Se requieren mínimo 3 fotografías para realizar el
                        análisis asistido por IA.
                      </p>
                    )}

                   {analisis && (
  <div className="mt-5 space-y-4 border-t border-blue-200 pt-5">
    <div>
      <div className="text-xs font-black uppercase tracking-wide text-blue-700">
        Resumen del análisis
      </div>

      <p className="mt-2 text-sm leading-relaxed text-neutral-800">
        {analisis.resumen || "Sin resumen disponible."}
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Dato
        titulo="Severidad visible"
        valor={analisis.severidad_visible || "NO DETERMINABLE"}
      />

      <Dato
        titulo="Calidad de la evidencia"
        valor={analisis.calidad_evidencia || "NO DETERMINABLE"}
      />
    </div>

    {analisis.hallazgos &&
      analisis.hallazgos.length > 0 && (
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">
            Hallazgos visibles
          </div>

          <div className="mt-2 space-y-2">
            {analisis.hallazgos.map((hallazgo, index) => (
              <div
                key={index}
                className="rounded-xl border border-blue-100 bg-white p-3"
              >
                <div className="text-sm font-bold text-neutral-900">
                  {hallazgo.tipo || `Hallazgo ${index + 1}`}
                </div>

                <p className="mt-1 text-sm text-neutral-700">
                  {hallazgo.descripcion || "Sin descripción."}
                </p>

                {hallazgo.imagen_referencia && (
                  <div className="mt-1 text-xs font-semibold text-neutral-500">
                    Imagen: {hallazgo.imagen_referencia}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    {analisis.consistencia_imagenes && (
      <div>
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">
          Consistencia entre imágenes
        </div>

        <p className="mt-1 text-sm leading-relaxed text-neutral-800">
          {analisis.consistencia_imagenes}
        </p>
      </div>
    )}

    {analisis.evaluacion_soporte && (
      <div>
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">
          Evaluación del soporte
        </div>

        <p className="mt-1 text-sm leading-relaxed text-neutral-800">
          {analisis.evaluacion_soporte}
        </p>
      </div>
    )}

    {analisis.recomendacion_apoyo && (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="text-xs font-black uppercase tracking-wide text-amber-800">
          Recomendación de apoyo
        </div>

        <p className="mt-1 text-sm leading-relaxed text-amber-900">
          {analisis.recomendacion_apoyo}
        </p>
      </div>
    )}

    {analisis.advertencias && (
      <div className="rounded-xl border border-neutral-300 bg-white p-4">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-600">
          Advertencias y limitaciones
        </div>

        <p className="mt-1 text-sm leading-relaxed text-neutral-700">
          {analisis.advertencias}
        </p>
      </div>
    )}

    <p className="text-xs font-semibold text-blue-800">
      Este análisis es únicamente una herramienta de apoyo. La aprobación
      o rechazo de la reposición corresponde exclusivamente al responsable
      autorizado.
    </p>
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