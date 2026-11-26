import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  buscarEmpleado,
  createSessionToken,
  verifySessionToken,
} from "../../lib/auth";

async function listarProveedoresPublicos() {
  return prisma.proveedor.findMany({
    orderBy: { idProveedor: "asc" },
    select: {
      idProveedor: true,
      nombre: true,
      correo: true,
    },
  });
}

// GET /ordenes/api/auth -> Verifica la sesión del personal de la empresa en cookie HttpOnly
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const empleado = verifySessionToken(token);
    const proveedoresPublicos = await listarProveedoresPublicos();

    if (!empleado) {
      return NextResponse.json({
        autenticado: false,
        empleado: null,
        proveedoresPublicos,
      });
    }

    return NextResponse.json({
      autenticado: true,
      empleado,
      proveedoresPublicos,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /ordenes/api/auth -> Inicia sesión con una cuenta de personal de la empresa
export async function POST(request) {
  try {
    const body = await request.json();
    const correo = (body.correo || "").trim().toLowerCase();
    const password = body.password || "";

    if (!correo || !password) {
      return NextResponse.json(
        { error: "Por favor ingresa tu correo corporativo y contraseña." },
        { status: 400 }
      );
    }

    const empleado = buscarEmpleado(correo, password);

    if (!empleado) {
      return NextResponse.json(
        { error: "Credenciales inválidas. Usa una cuenta de personal de Catlovers." },
        { status: 401 }
      );
    }

    const token = createSessionToken(empleado);
    const response = NextResponse.json({
      ok: true,
      empleado,
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

// DELETE /ordenes/api/auth -> Cierra la sesión corporativa eliminando la cookie HttpOnly
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
