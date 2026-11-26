import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, createSessionToken, verifySessionToken } from "@/lib/session";
import { CUENTAS_DEMO, PERFILES, RUTA_POR_PERFIL } from "@/lib/cuentasDemo";

// GET /api/auth -> Sesión única con perfil del usuario autenticado
export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const usuario = await verifySessionToken(token);
  const proveedoresPublicos = await prisma.proveedor.findMany({
    orderBy: { idProveedor: "asc" },
    select: { idProveedor: true, nombre: true, correo: true },
  });

  if (!usuario) {
    return NextResponse.json({
      autenticado: false,
      perfil: null,
      usuario: null,
      proveedoresPublicos,
    });
  }

  return NextResponse.json({
    autenticado: true,
    perfil: usuario.perfil,
    usuario,
    ruta: RUTA_POR_PERFIL[usuario.perfil] || "/",
    proveedoresPublicos,
  });
}

// POST /api/auth -> Login único: valida credenciales según el perfil elegido
export async function POST(request) {
  try {
    const body = await request.json();
    const perfil = (body.perfil || "").trim();
    const correo = (body.correo || "").trim().toLowerCase();
    const password = body.password || "";

    if (!Object.values(PERFILES).includes(perfil)) {
      return NextResponse.json({ error: "Selecciona un perfil válido." }, { status: 400 });
    }

    if (!correo || !password) {
      return NextResponse.json(
        { error: "Por favor ingresa tu correo y contraseña." },
        { status: 400 }
      );
    }

    let usuario = null;

    if (perfil === PERFILES.PROVEEDOR) {
      const proveedor = await prisma.proveedor.findUnique({ where: { correo } });
      if (proveedor && proveedor.password === password) {
        usuario = {
          perfil,
          idProveedor: proveedor.idProveedor,
          nombre: proveedor.nombre,
          correo: proveedor.correo,
        };
      }
    } else {
      const lista = perfil === PERFILES.ORDENES ? CUENTAS_DEMO.ordenes : CUENTAS_DEMO.bodega;
      const cuenta = lista.find((c) => c.correo === correo);
      if (cuenta && cuenta.password === password) {
        const { password: _password, ...datosPublicos } = cuenta;
        usuario = { perfil, ...datosPublicos };
      }
    }

    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciales inválidas o perfil incorrecto. Verifica tus datos." },
        { status: 401 }
      );
    }

    const token = await createSessionToken(usuario);
    const response = NextResponse.json({
      ok: true,
      perfil,
      usuario,
      ruta: RUTA_POR_PERFIL[perfil],
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 horas
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/auth -> Cierra la sesión única
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
