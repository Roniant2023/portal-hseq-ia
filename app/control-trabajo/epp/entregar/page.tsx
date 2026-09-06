"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import FirmaCanvas from "@/app/components/FirmaCanvas";
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
  requiere_aprobacion_reposicion: boolean;
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
  requiere_aprobacion_reposicion: boolean;
};

type EppEntregadoAnterior = {
  id: string;
  entrega_id: string;
  epp_id: string;
  inventario_id: string | null;
  cantidad: number;
  talla: string | null;
  lote: string | null;
  serial: string | null;
  estado_elemento: string | null;
  fecha_entrega: string;

  epp_catalogo?: {
  codigo: string;
  nombre: string;
}[] | null;
};
type ReposicionAprobada = {
  id: string;
  fecha_solicitud: string;
  fecha_entrega_solicitada: string | null;
  cantidad_solicitada: number;
  motivo: string;
  justificacion: string | null;
  responsable_entrega_sugerido: string | null;

  trabajador: {
    identificacion: string;
    nombres: string;
    apellidos: string;
  } | null;

  epp: {
    codigo: string;
    nombre: string;
  } | null;

  ubicacion: {
    nombre: string;
  } | null;
};
const motivos = [
   { value: "INGRESO", label: "Ingreso del trabajador" },
  { value: "DOTACION", label: "Dotación" },
  { value: "REPOSICION", label: "Reposición" },
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
const [motivoReposicion, setMotivoReposicion] = useState("");
const [estadoEppAnterior, setEstadoEppAnterior] = useState("");
const [justificacionReposicion, setJustificacionReposicion] = useState("");
const [fotosReposicion, setFotosReposicion] = useState<File[]>([]);
  const [fechaEntrega, setFechaEntrega] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [inventarioSeleccionado, setInventarioSeleccionado] =
    useState("");
  const [cantidad, setCantidad] = useState("1");

  const [items, setItems] = useState<ItemEntrega[]>([]);

const [eppEntregadosAnteriormente, setEppEntregadosAnteriormente] =
  useState<EppEntregadoAnterior[]>([]);

const [entregaOriginalId, setEntregaOriginalId] = useState("");
const [detalleOriginalId, setDetalleOriginalId] = useState("");
  const [busquedaInventario, setBusquedaInventario] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
const [reposicionesAprobadas, setReposicionesAprobadas] =
  useState<ReposicionAprobada[]>([]);

const [procesandoReposicionId, setProcesandoReposicionId] =
  useState("");

const [responsableReposicion, setResponsableReposicion] =
  useState<Record<string, string>>({});

const [fechaReposicion, setFechaReposicion] =
  useState<Record<string, string>>({});
const [firmaEntrega, setFirmaEntrega] =
  useState<Blob | null>(null);

const [entregaPendienteFirmaId, setEntregaPendienteFirmaId] =
  useState("");

const [nombreRecibeFirma, setNombreRecibeFirma] =
  useState("");

const [guardandoFirma, setGuardandoFirma] =
  useState(false);
const [reposicionPendienteFirma, setReposicionPendienteFirma] =
  useState<ReposicionAprobada | null>(null);
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
  unidad_medida,
  requiere_aprobacion_reposicion
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
  cargarReposicionesAprobadas();
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
const detalleOriginalSeleccionado =
  eppEntregadosAnteriormente.find(
    (eppAnterior) => eppAnterior.id === detalleOriginalId
  );
const reposicionRequiereAprobacion =
  motivo === "REPOSICION" &&
  items.some((item) => item.requiere_aprobacion_reposicion);
async function cargarReposicionesAprobadas() {
  const { data, error: errorReposiciones } = await supabase
    .from("epp_reposiciones")
    .select(`
      id,
      fecha_solicitud,
      fecha_entrega_solicitada,
      cantidad_solicitada,
      motivo,
      justificacion,
      responsable_entrega_sugerido,
      trabajador:epp_trabajadores (
        identificacion,
        nombres,
        apellidos
      ),
      epp:epp_catalogo (
        codigo,
        nombre
      ),
      ubicacion:epp_ubicaciones (
        nombre
      )
    `)
    .eq("estado", "APROBADA")
    .eq("requiere_aprobacion", true)
    .is("nueva_entrega_id", null)
    .order("fecha_aprobacion", { ascending: true });

  if (errorReposiciones) {
    console.error(
      "ERROR CONSULTANDO REPOSICIONES APROBADAS:",
      errorReposiciones
    );
    return;
  }

  const resultado =
    (data ?? []) as unknown as ReposicionAprobada[];

  setReposicionesAprobadas(resultado);

  const responsablesIniciales: Record<string, string> = {};
  const fechasIniciales: Record<string, string> = {};

  resultado.forEach((reposicion) => {
    responsablesIniciales[reposicion.id] =
      reposicion.responsable_entrega_sugerido || "";

    fechasIniciales[reposicion.id] =
      reposicion.fecha_entrega_solicitada ||
      new Date().toLocaleDateString("en-CA");
  });

  setResponsableReposicion(responsablesIniciales);
  setFechaReposicion(fechasIniciales);
}
async function cargarEppEntregadosAnteriormente(trabajadorIdConsulta: string) {
  setEppEntregadosAnteriormente([]);
  setEntregaOriginalId("");

  if (!trabajadorIdConsulta) {
    return;
  }

  const { data: entregas, error: errorEntregas } = await supabase
    .from("epp_entregas")
    .select("id,fecha_entrega")
    .eq("trabajador_id", trabajadorIdConsulta)
    .eq("estado", "CONFIRMADA")
    .order("fecha_entrega", { ascending: false });

  if (errorEntregas) {
    console.error(errorEntregas);
    setError(
      `No fue posible consultar las entregas anteriores: ${errorEntregas.message}`
    );
    return;
  }

  if (!entregas || entregas.length === 0) {
    return;
  }

  const idsEntregas = entregas.map((entrega) => entrega.id);

  const { data: detalles, error: errorDetalles } = await supabase
    .from("epp_entrega_detalle")
    .select(`
  id,
  entrega_id,
  epp_id,
  inventario_id,
  cantidad,
  talla,
  lote,
  serial,
  estado_elemento,
  epp_catalogo (
    codigo,
    nombre
  )
`)
    .in("entrega_id", idsEntregas);

  if (errorDetalles) {
    console.error(errorDetalles);
    setError(
      `No fue posible consultar los EPP entregados anteriormente: ${errorDetalles.message}`
    );
    return;
  }

  const fechasPorEntrega = new Map(
    entregas.map((entrega) => [entrega.id, entrega.fecha_entrega])
  );

  const resultado = (detalles ?? []).map((detalle) => ({
    ...detalle,
    fecha_entrega: fechasPorEntrega.get(detalle.entrega_id) || "",
  }));

  setEppEntregadosAnteriormente(
  resultado as unknown as EppEntregadoAnterior[]
); 
}
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
if (motivo === "REPOSICION") {
  if (!detalleOriginalSeleccionado) {
    setError(
      "Selecciona primero el EPP anterior que será reemplazado."
    );
    return;
  }

  if (
    registroSeleccionado.epp_id !==
    detalleOriginalSeleccionado.epp_id
  ) {
    setError(
      "El EPP de reposición debe ser del mismo tipo que el EPP que se está reemplazando."
    );
    return;
  }
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
requiere_aprobacion_reposicion:
  registroSeleccionado.epp_catalogo?.requiere_aprobacion_reposicion ?? false,
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
async function subirFotosReposicion(reposicionId: string) {
  for (let index = 0; index < fotosReposicion.length; index++) {
    const foto = fotosReposicion[index];

    const extension =
      foto.name.split(".").pop()?.toLowerCase() || "jpg";

    const nombreArchivo = `foto-${index + 1}-${crypto.randomUUID()}.${extension}`;

    const rutaStorage = `${reposicionId}/${nombreArchivo}`;

    const { error: errorStorage } = await supabase.storage
      .from("epp-reposiciones")
      .upload(rutaStorage, foto, {
        cacheControl: "3600",
        upsert: false,
        contentType: foto.type,
      });

    if (errorStorage) {
      throw new Error(
        `No fue posible subir la fotografía ${index + 1}: ${errorStorage.message}`
      );
    }

    const { error: errorRegistro } = await supabase
      .from("epp_reposiciones_fotos")
      .insert({
        reposicion_id: reposicionId,
        ruta_storage: rutaStorage,
        nombre_archivo: foto.name,
        orden: index + 1,
      });

    if (errorRegistro) {
      // Evitar dejar el archivo huérfano si falla el registro en la tabla.
      await supabase.storage
        .from("epp-reposiciones")
        .remove([rutaStorage]);

      throw new Error(
        `No fue posible registrar la fotografía ${index + 1}: ${errorRegistro.message}`
      );
    }
  }
}
async function guardarFirmaEntrega() {
  setMensaje("");
  setError("");

  if (!entregaPendienteFirmaId) {
    setError("No se encontró la entrega que se va a firmar.");
    return;
  }

  if (!nombreRecibeFirma.trim()) {
    setError("Debes indicar el nombre de quien recibe el EPP.");
    return;
  }

  if (!firmaEntrega) {
    setError("El trabajador debe registrar su firma.");
    return;
  }

  setGuardandoFirma(true);

  const nombreArchivo = `firma-${crypto.randomUUID()}.png`;
  const rutaStorage =
    `${entregaPendienteFirmaId}/${nombreArchivo}`;

  try {
    const { error: errorStorage } =
      await supabase.storage
        .from("epp-firmas")
        .upload(rutaStorage, firmaEntrega, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/png",
        });

    if (errorStorage) {
      throw new Error(
        `No fue posible guardar la firma: ${errorStorage.message}`
      );
    }

    const { error: errorFirma } =
      await supabase.rpc(
        "registrar_firma_entrega_epp",
        {
          p_entrega_id: entregaPendienteFirmaId,
          p_recibido_por: nombreRecibeFirma.trim(),
          p_firma_url: rutaStorage,
        }
      );

    if (errorFirma) {
      // Si falla el registro en la base de datos,
      // eliminamos la imagen para no dejar archivos huérfanos.
      await supabase.storage
        .from("epp-firmas")
        .remove([rutaStorage]);

      throw new Error(
        `No fue posible asociar la firma a la entrega: ${errorFirma.message}`
      );
    }

setMensaje("Firma registrada correctamente.");

setFirmaEntrega(null);
setEntregaPendienteFirmaId("");
setNombreRecibeFirma("");
setReposicionPendienteFirma(null);
  } catch (errorFirma: any) {
    console.error(
      "ERROR REGISTRANDO FIRMA DE EPP:",
      errorFirma
    );

    setError(
      errorFirma?.message ||
        "Ocurrió un error al registrar la firma."
    );
  } finally {
    setGuardandoFirma(false);
  }
}
async function entregarReposicionAprobada(
  reposicion: ReposicionAprobada
) {
  setMensaje("");
  setError("");

  const responsable =
    responsableReposicion[reposicion.id]?.trim() || "";

  const fecha =
    fechaReposicion[reposicion.id] || "";

  if (!responsable) {
    setError(
      "Debes indicar el responsable de la entrega."
    );
    return;
  }

  if (!fecha) {
    setError(
      "Debes indicar la fecha de entrega."
    );
    return;
  }

  const confirmar = window.confirm(
    `¿Confirmas la entrega de ${
      reposicion.epp?.nombre || "este EPP"
    } a ${
      reposicion.trabajador?.nombres || ""
    } ${
      reposicion.trabajador?.apellidos || ""
    }?`
  );

  if (!confirmar) {
    return;
  }

  setProcesandoReposicionId(reposicion.id);

  const { data, error: errorEntrega } =
    await supabase.rpc(
      "entregar_reposicion_aprobada",
      {
        p_reposicion_id: reposicion.id,
        p_entregado_por: responsable,
        p_fecha_entrega: fecha,
        p_observaciones: null,
      }
    );

  if (errorEntrega) {
    console.error(
      "ERROR ENTREGANDO REPOSICIÓN APROBADA:",
      errorEntrega
    );

    setError(
      `No fue posible realizar la entrega: ${
        errorEntrega.message
      }`
    );

    setProcesandoReposicionId("");
    return;
  }

  setMensaje(
  "Reposición entregada correctamente. Pendiente firma de recibido."
);

if (data) {
  setEntregaPendienteFirmaId(data);

  setNombreRecibeFirma(
    reposicion.trabajador
      ? `${reposicion.trabajador.nombres} ${reposicion.trabajador.apellidos}`
      : ""
  );

  setFirmaEntrega(null);
  setReposicionPendienteFirma(reposicion);
}

await Promise.all([
  cargarReposicionesAprobadas(),
  cargarDatos(),
]);

setProcesandoReposicionId("");
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
if (motivo === "REPOSICION") {
  if (!detalleOriginalId || !entregaOriginalId) {
    setError(
      "Selecciona el EPP anterior que será reemplazado."
    );
    return;
  }

  if (!motivoReposicion) {
    setError(
      "Selecciona el motivo de la reposición."
    );
    return;
  }

  if (!estadoEppAnterior) {
    setError(
      "Selecciona el estado del EPP anterior."
    );
    return;
  }

  if (!justificacionReposicion.trim()) {
    setError(
      "Debes registrar la justificación de la reposición."
    );
    return;
  }

if (reposicionRequiereAprobacion) {
  if (fotosReposicion.length < 3) {
    setError(
      "Debes adjuntar mínimo 3 fotografías del EPP que será reemplazado."
    );
    return;
  }

  if (fotosReposicion.length > 5) {
    setError(
      "Solo puedes adjuntar máximo 5 fotografías del EPP que será reemplazado."
    );
    return;
  }
}

  if (items.length !== 1) {
    setError(
      "Una reposición debe registrarse para un solo EPP a la vez."
    );
    return;
  }

  const itemReposicion = items[0];

  if (
    !detalleOriginalSeleccionado ||
    itemReposicion.epp_id !== detalleOriginalSeleccionado.epp_id
  ) {
    setError(
      "El EPP de reposición debe corresponder al mismo EPP que se está reemplazando."
    );
    return;
  }
}
   setGuardando(true);

let data: string | null = null;
let errorRpc: any = null;

if (motivo !== "REPOSICION") {
  const itemsRpc = items.map((item) => ({
    inventario_id: item.inventario_id,
    cantidad: item.cantidad,
  }));

  const respuesta = await supabase.rpc(
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

  data = respuesta.data;
  errorRpc = respuesta.error;
} else {
  const itemReposicion = items[0];

  if (reposicionRequiereAprobacion) {
    const respuesta = await supabase.rpc(
      "solicitar_reposicion_epp",
      {
        p_trabajador_id: trabajadorId,
        p_epp_id: itemReposicion.epp_id,
        p_entrega_original_id: entregaOriginalId,
        p_inventario_id: itemReposicion.inventario_id,
        p_ubicacion_id: ubicacionId,
        p_cantidad: itemReposicion.cantidad,
        p_motivo: motivoReposicion,
        p_estado_epp_anterior: estadoEppAnterior,
        p_justificacion: justificacionReposicion.trim(),
        p_responsable_entrega_sugerido: entregadoPor.trim(),
        p_fecha_entrega_solicitada: fechaEntrega,
        p_observaciones:
          observaciones.trim() || null,
      }
    );

    data = respuesta.data;
    errorRpc = respuesta.error;
  } else {
    const respuesta = await supabase.rpc(
      "registrar_reposicion_epp",
      {
        p_trabajador_id: trabajadorId,
        p_epp_id: itemReposicion.epp_id,
        p_entrega_original_id: entregaOriginalId,
        p_inventario_id: itemReposicion.inventario_id,
        p_ubicacion_id: ubicacionId,
        p_cantidad: itemReposicion.cantidad,
        p_motivo: motivoReposicion,
        p_estado_epp_anterior: estadoEppAnterior,
        p_justificacion: justificacionReposicion.trim(),
        p_entregado_por: entregadoPor.trim(),
        p_fecha_entrega: fechaEntrega,
        p_observaciones:
          observaciones.trim() || null,
      }
    );

    data = respuesta.data;
    errorRpc = respuesta.error;
  }
}

if (errorRpc) {
  const detalleError = [
    errorRpc?.message,
    errorRpc?.details,
    errorRpc?.hint,
    errorRpc?.code,
  ]
    .filter(Boolean)
    .join(" | ");

  console.log("ERROR RPC COMPLETO:", errorRpc);

  setError(
    motivo === "REPOSICION"
      ? `No fue posible registrar la reposición: ${
          detalleError || JSON.stringify(errorRpc)
        }`
      : `No fue posible registrar la entrega: ${
          detalleError || JSON.stringify(errorRpc)
        }`
  );

  setGuardando(false);
  return;
}

if (motivo === "REPOSICION" && reposicionRequiereAprobacion) {
  if (!data) {
    setError(
      "La reposición fue procesada, pero no se recibió el ID del registro."
    );
    setGuardando(false);
    return;
  }

  try {
    await subirFotosReposicion(data);
  } catch (errorFotos: any) {
    console.error("ERROR SUBIENDO FOTOS:", errorFotos);

    setError(
      `La reposición fue registrada, pero ocurrió un error al guardar la evidencia fotográfica: ${
        errorFotos?.message || "Error desconocido"
      }`
    );

    setGuardando(false);
    return;
  }
}
if (motivo === "REPOSICION" && reposicionRequiereAprobacion) {
  setMensaje(
    `Solicitud de reposición enviada para aprobación. ID: ${data}`
  );
} else if (motivo === "REPOSICION") {
  if (!data) {
    setError(
      "La reposición fue registrada, pero no se recibió el ID de la reposición."
    );
    setGuardando(false);
    return;
  }

  const { data: reposicionRegistrada, error: errorConsultaReposicion } =
    await supabase
      .from("epp_reposiciones")
      .select("nueva_entrega_id")
      .eq("id", data)
      .single();

  if (errorConsultaReposicion) {
    console.error(
      "ERROR CONSULTANDO ENTREGA DE LA REPOSICIÓN:",
      errorConsultaReposicion
    );

    setError(
      `La reposición fue registrada, pero no fue posible obtener la entrega para la firma: ${errorConsultaReposicion.message}`
    );

    setGuardando(false);
    return;
  }

  if (!reposicionRegistrada?.nueva_entrega_id) {
    setError(
      "La reposición fue registrada, pero no se encontró la entrega asociada para registrar la firma."
    );

    setGuardando(false);
    return;
  }

  setMensaje(
    "Reposición registrada correctamente. Pendiente firma de recibido."
  );

  setEntregaPendienteFirmaId(
    reposicionRegistrada.nueva_entrega_id
  );

  setNombreRecibeFirma(
    trabajadorSeleccionado
      ? `${trabajadorSeleccionado.nombres} ${trabajadorSeleccionado.apellidos}`
      : ""
  );

  setFirmaEntrega(null);
} else {
  setMensaje(
    `Entrega registrada correctamente. Pendiente firma de recibido.`
  );
if (data) {
  setEntregaPendienteFirmaId(data);

  setNombreRecibeFirma(
    trabajadorSeleccionado
      ? `${trabajadorSeleccionado.nombres} ${trabajadorSeleccionado.apellidos}`
      : ""
  );

  setFirmaEntrega(null);
}
}
    setItems([]);
    setInventarioSeleccionado("");
    setCantidad("1");
    setObservaciones("");
setFotosReposicion([]);
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
       ) : reposicionPendienteFirma && entregaPendienteFirmaId ? (
  <section className="rounded-3xl border border-blue-200 bg-blue-50/40 p-6 md:p-8 shadow-sm">

    <div className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
      ENTREGA REALIZADA
    </div>

    <h2 className="mt-4 text-3xl font-black text-neutral-950">
      Firma de recibido
    </h2>

    <p className="mt-2 text-neutral-600">
      La entrega ya fue registrada. Verifica la información antes de que
      el trabajador firme el recibido.
    </p>

    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <Dato
          titulo="Trabajador"
          valor={
            reposicionPendienteFirma.trabajador
              ? `${reposicionPendienteFirma.trabajador.nombres} ${reposicionPendienteFirma.trabajador.apellidos}`
              : "—"
          }
        />

        <Dato
          titulo="Identificación"
          valor={
            reposicionPendienteFirma.trabajador?.identificacion
              ? `CC ${reposicionPendienteFirma.trabajador.identificacion}`
              : "—"
          }
        />

        <Dato
          titulo="EPP entregado"
          valor={
            reposicionPendienteFirma.epp
              ? `${reposicionPendienteFirma.epp.codigo} - ${reposicionPendienteFirma.epp.nombre}`
              : "—"
          }
        />

        <Dato
          titulo="Cantidad"
          valor={String(reposicionPendienteFirma.cantidad_solicitada)}
        />

        <Dato
          titulo="Lugar de entrega"
          valor={reposicionPendienteFirma.ubicacion?.nombre || "—"}
        />

        <Dato
          titulo="Motivo de reposición"
          valor={reposicionPendienteFirma.motivo}
        />

      </div>

      {reposicionPendienteFirma.justificacion && (
        <div className="mt-4">
          <Dato
            titulo="Justificación"
            valor={reposicionPendienteFirma.justificacion}
          />
        </div>
      )}
    </div>

    <div className="mt-6">
      <Etiqueta texto="Recibido por *" />

      <input
        value={nombreRecibeFirma}
        onChange={(e) => setNombreRecibeFirma(e.target.value)}
        placeholder="Nombre completo del trabajador"
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
      />
    </div>

    <div className="mt-6">
      <Etiqueta texto="Firma del trabajador *" />

      <div className="mt-2">
        <FirmaCanvas
          onChange={(firma) => setFirmaEntrega(firma)}
        />
      </div>
    </div>

    <button
      type="button"
      onClick={guardarFirmaEntrega}
      disabled={guardandoFirma || !firmaEntrega}
      className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-4 text-lg font-black text-white disabled:opacity-40"
    >
      {guardandoFirma
        ? "Registrando firma..."
        : "Registrar firma de recibido"}
    </button>

  </section>
) : (
  <>
    {reposicionesAprobadas.length > 0 && (
  <section className="rounded-3xl border border-green-200 bg-green-50/40 p-6 md:p-8 shadow-sm">
    <div>
      <h2 className="text-2xl font-black">
        Reposiciones aprobadas pendientes de entrega
      </h2>

      <p className="mt-2 text-sm text-neutral-600">
        Estas solicitudes ya fueron autorizadas y están listas para
        realizar la entrega física al trabajador.
      </p>
    </div>

    <div className="mt-6 space-y-4">
      {reposicionesAprobadas.map((reposicion) => (
        <div
          key={reposicion.id}
          className="rounded-2xl border border-green-200 bg-white p-5"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="text-lg font-black">
                {reposicion.epp?.codigo || "EPP"} -{" "}
                {reposicion.epp?.nombre || "Sin nombre"}
              </div>

              <div className="text-sm text-neutral-700">
                <span className="font-bold">Trabajador:</span>{" "}
                {reposicion.trabajador?.nombres || ""}{" "}
                {reposicion.trabajador?.apellidos || ""}
                {reposicion.trabajador?.identificacion
                  ? ` · CC ${reposicion.trabajador.identificacion}`
                  : ""}
              </div>

              <div className="text-sm text-neutral-700">
                <span className="font-bold">Ubicación:</span>{" "}
                {reposicion.ubicacion?.nombre || "—"}
              </div>

              <div className="text-sm text-neutral-700">
                <span className="font-bold">Cantidad:</span>{" "}
                {reposicion.cantidad_solicitada}
              </div>

              <div className="text-sm text-neutral-700">
                <span className="font-bold">Motivo:</span>{" "}
                {reposicion.motivo}
              </div>

              {reposicion.justificacion && (
                <div className="text-sm text-neutral-700">
                  <span className="font-bold">Justificación:</span>{" "}
                  {reposicion.justificacion}
                </div>
              )}
            </div>

            <div className="w-full space-y-4 lg:max-w-sm">
              <div>
                <Etiqueta texto="Responsable de la entrega *" />

                <input
                  value={responsableReposicion[reposicion.id] || ""}
                  onChange={(e) =>
                    setResponsableReposicion((anteriores) => ({
                      ...anteriores,
                      [reposicion.id]: e.target.value,
                    }))
                  }
                  placeholder="Nombre del responsable"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
                />
              </div>

              <div>
                <Etiqueta texto="Fecha de entrega *" />

                <input
                  type="date"
                  value={fechaReposicion[reposicion.id] || ""}
                  onChange={(e) =>
                    setFechaReposicion((anteriores) => ({
                      ...anteriores,
                      [reposicion.id]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
                />
              </div>

              <button
                type="button"
                disabled={
                  procesandoReposicionId === reposicion.id
                }
                onClick={() =>
                  entregarReposicionAprobada(reposicion)
                }
                className="w-full rounded-xl bg-green-700 px-5 py-3 font-black text-white disabled:opacity-40"
              >
                {procesandoReposicionId === reposicion.id
                  ? "Registrando entrega..."
                  : "Realizar entrega"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
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
cargarEppEntregadosAnteriormente(trabajador.id);
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
{motivo === "REPOSICION" && (
  <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
    <h3 className="text-lg font-black">
      Datos de la reposición
    </h3>

    <p className="mt-1 text-sm text-neutral-600">
      Registra la causa y condición del EPP que será reemplazado.
    </p>
<div className="mt-5">
  <Etiqueta texto="EPP anterior a reemplazar *" />

  <select
  value={detalleOriginalId}
  onChange={(e) => {
    const detalleId = e.target.value;

    setDetalleOriginalId(detalleId);

    const detalleSeleccionado =
      eppEntregadosAnteriormente.find(
        (eppAnterior) => eppAnterior.id === detalleId
      );

    setEntregaOriginalId(
      detalleSeleccionado?.entrega_id || ""
    );
  }}
    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
  >
    <option value="">Seleccionar EPP entregado anteriormente...</option>

 {eppEntregadosAnteriormente.map((eppAnterior) => {
  const catalogoEpp = inventario.find(
    (registro) => registro.epp_id === eppAnterior.epp_id
  )?.epp_catalogo;

  return (
    <option
      key={eppAnterior.id}
      value={eppAnterior.id}
    >
      {catalogoEpp?.codigo || "EPP"} -{" "}
      {catalogoEpp?.nombre || "Sin nombre"}
      {eppAnterior.talla
        ? ` | Talla ${eppAnterior.talla}`
        : ""}
      {eppAnterior.fecha_entrega
        ? ` | Entregado: ${eppAnterior.fecha_entrega}`
        : ""}
    </option>
  );
})}
  </select>

  {trabajadorId && eppEntregadosAnteriormente.length === 0 && (
    <p className="mt-2 text-sm text-amber-700">
      Este trabajador no tiene EPP entregados anteriormente disponibles
      para reposición.
    </p>
  )}
</div>
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <Etiqueta texto="Motivo de la reposición *" />

        <select
          value={motivoReposicion}
          onChange={(e) => setMotivoReposicion(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
       >
  <option value="">Seleccionar...</option>
  <option value="DETERIORO">Deterioro</option>
  <option value="DANO_OPERACIONAL">Daño operacional</option>
  <option value="CAMBIO_TALLA">Cambio de talla</option>
  <option value="PERDIDA">Pérdida</option>
  <option value="VENCIMIENTO">Vencimiento</option>
  <option value="CONTAMINACION">Contaminación</option>
  <option value="REQUERIMIENTO_CLIENTE">
    Requerimiento del cliente
  </option>
  <option value="OTRO">Otro</option>
        </select>
      </div>

      <div>
        <Etiqueta texto="Estado del EPP anterior *" />

        <select
          value={estadoEppAnterior}
          onChange={(e) => setEstadoEppAnterior(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
        >
          <option value="">Seleccionar...</option>
          <option value="DAÑADO">Dañado</option>
          <option value="DETERIORADO">Deteriorado</option>
          <option value="FUERA_DE_SERVICIO">
            Fuera de servicio
          </option>
        </select>
      </div>
    </div>

    <div className="mt-5">
      <Etiqueta texto="Justificación de la reposición *" />

      <textarea
        value={justificacionReposicion}
        onChange={(e) => setJustificacionReposicion(e.target.value)}
        rows={3}
        placeholder="Describe brevemente por qué se requiere reemplazar el EPP..."
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
      />
    </div>

  </div>
)}

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
{reposicionRequiereAprobacion && (
  <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
    <div className="font-black text-amber-900">
      ⚠️ Esta reposición requiere aprobación previa
    </div>

    <p className="mt-1 text-sm text-amber-800">
      Uno o más EPP seleccionados requieren autorización antes de realizar
      la entrega. El inventario no será descontado hasta completar la
      aprobación.
    </p>
  </div>
)}
{reposicionRequiereAprobacion && (
  <div className="mt-5">
    <Etiqueta texto="Evidencia fotográfica del EPP a reemplazar *" />

  <p className="mb-3 text-sm text-neutral-600">
    Adjunta mínimo 3 y máximo 5 fotografías que permitan evidenciar
    claramente el estado del elemento.
  </p>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    
    onChange={(e) => {
  const nuevosArchivos = Array.from(e.target.files ?? []);

  const totalFotos = [
    ...fotosReposicion,
    ...nuevosArchivos,
  ];

  if (totalFotos.length > 5) {
    setError(
      "Solo puedes adjuntar máximo 5 fotografías."
    );
    e.target.value = "";
    return;
  }

  setFotosReposicion(totalFotos);
  setError("");

  // Permite volver a seleccionar archivos posteriormente
  e.target.value = "";
}}
    className="block w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm"
  />

  <div className="mt-3 text-sm font-semibold">
    {fotosReposicion.length} de 5 fotografías seleccionadas
  </div>
 {fotosReposicion.map((foto, index) => (
  <div
    key={`${foto.name}-${index}`}
    className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
  >
    <img
      src={URL.createObjectURL(foto)}
      alt={`Evidencia ${index + 1}`}
      className="h-40 w-full object-cover"
    />

    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-xs text-neutral-600">
        Foto {index + 1}
      </span>

      <button
        type="button"
        onClick={() => {
          setFotosReposicion((anteriores) =>
            anteriores.filter((_, i) => i !== index)
          );
        }}
        className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50"
      >
        Quitar
      </button>
    </div>
  </div>
))}
    </div>
)}
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
{entregaPendienteFirmaId && (
  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 md:p-6">
    <div>
      <h3 className="text-xl font-black text-blue-950">
        Firma de recibido
      </h3>

      <p className="mt-1 text-sm text-blue-800">
        La entrega ya fue registrada. El trabajador debe firmar
        para dejar evidencia de recibido.
      </p>
    </div>

    <div className="mt-5">
      <Etiqueta texto="Recibido por *" />

      <input
        value={nombreRecibeFirma}
        onChange={(e) =>
          setNombreRecibeFirma(e.target.value)
        }
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
        placeholder="Nombre del trabajador que recibe"
      />
    </div>

    <div className="mt-5">
      <Etiqueta texto="Firma del trabajador *" />

      <div className="mt-2">
        <FirmaCanvas
          onChange={(firma) => setFirmaEntrega(firma)}
        />
      </div>
    </div>

    <button
      type="button"
      onClick={guardarFirmaEntrega}
      disabled={guardandoFirma || !firmaEntrega}
      className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-4 font-black text-white disabled:opacity-40"
    >
      {guardandoFirma
        ? "Guardando firma..."
        : "Registrar firma de recibido"}
    </button>
  </div>
)}
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