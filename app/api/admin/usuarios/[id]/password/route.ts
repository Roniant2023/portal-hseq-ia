import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
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

    // Validar la sesión del usuario que hace la solicitud
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
        {
          error:
            "La sesión no es válida o expiró.",
        },
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

    // Verificar que el solicitante sea ADMIN activo
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
            "No tienes permisos para cambiar contraseñas.",
        },
        { status: 403 }
      );
    }

    const { id: targetUserId } = await context.params;

    if (!targetUserId) {
      return NextResponse.json(
        {
          error:
            "No se indicó el usuario.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const nuevaContrasena =
      typeof body.nuevaContrasena === "string"
        ? body.nuevaContrasena
        : "";

    if (nuevaContrasena.length < 8) {
      return NextResponse.json(
        {
          error:
            "La nueva contraseña debe tener al menos 8 caracteres.",
        },
        { status: 400 }
      );
    }

    // Comprobar que el usuario objetivo exista
    const {
      data: usuarioObjetivo,
      error: usuarioObjetivoError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        targetUserId
      );

    if (
      usuarioObjetivoError ||
      !usuarioObjetivo.user
    ) {
      return NextResponse.json(
        {
          error:
            "El usuario no existe.",
        },
        { status: 404 }
      );
    }

    // Cambiar contraseña
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        {
          password: nuevaContrasena,
        }
      );

    if (updateError) {
      return NextResponse.json(
        {
          error:
            updateError.message ||
            "No fue posible cambiar la contraseña.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error cambiando contraseña:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al cambiar la contraseña.",
      },
      { status: 500 }
    );
  }
}