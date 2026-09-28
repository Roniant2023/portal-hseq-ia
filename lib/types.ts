export type SOEPhotoItem = {
  name: string;
  previewUrl: string;
};

export type SOEForm = {
  fecha: string;
  nombre: string;
  cedula: string;
  cargo: string;
  empresa: string;
  ubicacion: string;
  frente_equipo: string;

  tipo_observacion: string;
  se_detuvo_tarea: string;

  area_unidad: string;
  area_otro: string;

  operacion_tarea: string;
  operacion_otro: string;

  descripcion_original: string;
  descripcion_mejorada: string;
  accion_inmediata: string;
  recomendacion: string;

  supervisor_control: string;
  requiere_seguimiento: string;
  requiere_ail: string;
  estado: string;

  // 👇 listo para fotos
  fotos: SOEPhotoItem[];
};

export const initialSOEForm: SOEForm = {
  fecha: "",
  nombre: "",
  cedula: "",
  cargo: "",
  empresa: "Estrella International Energy Services",
  ubicacion: "",
  frente_equipo: "",

  tipo_observacion: "",
  se_detuvo_tarea: "",

  area_unidad: "",
  area_otro: "",

  operacion_tarea: "",
  operacion_otro: "",

  descripcion_original: "",
  descripcion_mejorada: "",
  accion_inmediata: "",
  recomendacion: "",

  supervisor_control: "",
  requiere_seguimiento: "",
  requiere_ail: "",
  estado: "Abierto",

  fotos: [],
};