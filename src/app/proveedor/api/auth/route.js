import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, createSessionToken, verifySessionToken } from "../../lib/auth";

// GET /proveedor/api/auth -> Verifica si hay un proveedor con sesión activa en cookie HttpOnly
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const sesion = verifySessionToken(token);

    // Obtener lista pública de proveedores (sin exponer password en la respuesta general, pero enviando lista para selector de demo)
    const proveedoresPublicos = await prisma.proveedor.findMany({
      orderBy: { idProveedor: "asc" },
      select: {
        idProveedor: true,
        nombre: true,
        correo: true,
      },
    });

    if (!sesion) {
      return NextResponse.json({
        autenticado: false,
        proveedor: null,
        proveedoresPublicos,
      });
    }

    // Verificar que el proveedor aún exista en la base de datos
    const proveedorDB = await prisma.proveedor.findUnique({
      where: { idProveedor: Number(sesion.idProveedor) },
      select: {
        idProveedor: true,
        nombre: true,
        correo: true,
      },
    });

    if (!proveedorDB) {
      return NextResponse.json({
        autenticado: false,
        proveedor: null,
        proveedoresPublicos,
      });
    }

    return NextResponse.json({
      autenticado: true,
      proveedor: proveedorDB,
      proveedoresPublicos,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /proveedor/api/auth -> Inicia sesión validando correo y contraseña contra la tabla Proveedor
export async function POST(request) {
  try {
    const body = await request.json();
    const correo = (body.correo || "").trim().toLowerCase();
    const password = body.password || "";

    if (!correo || !password) {
      return NextResponse.json(
        { error: "Por favor ingresa tu correo electrónico y contraseña." },
        { status: 400 }
      );
    }

    const proveedor = await prisma.proveedor.findUnique({
      where: { correo },
    });

    if (!proveedor || proveedor.password !== password) {
      return NextResponse.json(
        { error: "Credenciales inválidas. Verifica tu correo y contraseña." },
        { status: 401 }
      );
    }

    const token = createSessionToken(proveedor);
    const response = NextResponse.json({
      ok: true,
      proveedor: {
        idProveedor: proveedor.idProveedor,
        nombre: proveedor.nombre,
        correo: proveedor.correo,
      },
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

// DELETE /proveedor/api/auth -> Cierra la sesión activa eliminando la cookie HttpOnly
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
