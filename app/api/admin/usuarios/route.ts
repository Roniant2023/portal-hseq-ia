import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // 1. Comprobar configuración del servidor
    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "Falta configuración de Supabase en el servidor.",
        },
        { status: 500 }
      );
    }

    // 2. Obtener token del ADMIN conectado
    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        { error: "Sesión no válida." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace(
      "Bearer ",
      ""
    );

    // Cliente normal para validar el JWT recibido
    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user: usuarioSolicitante },
      error: userError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (userError || !usuarioSolicitante) {
      return NextResponse.json(
        { error: "La sesión no es válida o expiró." },
        { status: 401 }
      );
    }

    // Cliente administrativo SOLO del servidor
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // 3. Verificar que quien hace la solicitud sea ADMIN activo
    const {
      data: perfilAdmin,
      error: perfilAdminError,
    } = await supabaseAdmin
      .from("perfiles_usuarios")
      .select("rol, activo")
      .eq("id", usuarioSolicitante.id)
      .single();

    if (
      perfilAdminError ||
      !perfilAdmin ||
      perfilAdmin.activo !== true ||
      perfilAdmin.rol?.toUpperCase() !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes permisos para crear usuarios.",
        },
        { status: 403 }
      );
    }

    // 4. Leer datos del formulario
    const body = await request.json();

    const nombre =
      typeof body.nombre === "string"
        ? body.nombre.trim()
        : "";

    const correo =
      typeof body.correo === "string"
        ? body.correo.trim().toLowerCase()
        : "";

    const cargo =
      typeof body.cargo === "string"
        ? body.cargo.trim()
        : "";

    const contrasena =
      typeof body.contrasena === "string"
        ? body.contrasena
        : "";

    const rol =
      typeof body.rol === "string"
        ? body.rol.toUpperCase()
        : "USUARIO";

    const activo = body.activo !== false;

    // 5. Validaciones del servidor
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio." },
        { status: 400 }
      );
    }

    if (!correo) {
      return NextResponse.json(
        { error: "El correo es obligatorio." },
        { status: 400 }
      );
    }

    if (contrasena.length < 8) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 8 caracteres.",
        },
        { status: 400 }
      );
    }

    if (!["ADMIN", "USUARIO"].includes(rol)) {
      return NextResponse.json(
        { error: "El rol indicado no es válido." },
        { status: 400 }
      );
    }

    // 6. Crear usuario en Supabase Auth
    const {
      data: usuarioCreado,
      error: crearUsuarioError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password: contrasena,
      email_confirm: true,
    });

    if (
      crearUsuarioError ||
      !usuarioCreado.user
    ) {
      return NextResponse.json(
        {
          error:
            crearUsuarioError?.message ||
            "No fue posible crear el usuario.",
        },
        { status: 400 }
      );
    }

    const nuevoUserId = usuarioCreado.user.id;

    // 7. Crear su perfil en public.perfiles_usuarios
    const { error: perfilError } =
      await supabaseAdmin
        .from("perfiles_usuarios")
        .insert({
          id: nuevoUserId,
          nombre,
          cargo: cargo || null,
          rol,
          activo,
        });

    // Si falla el perfil, eliminamos también la cuenta Auth
    // para no dejar un usuario incompleto.
    if (perfilError) {
      await supabaseAdmin.auth.admin.deleteUser(
        nuevoUserId
      );

      return NextResponse.json(
        {
          error:
            "No fue posible crear el perfil del usuario.",
        },
        { status: 500 }
      );
    }

    // 8. Respuesta correcta
    return NextResponse.json(
      {
        ok: true,
        usuario: {
          id: nuevoUserId,
          email: correo,
          nombre,
          cargo: cargo || null,
          rol,
          activo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error creando usuario del Portal HSEQ:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al crear el usuario.",
      },
      { status: 500 }
    );
  }
}