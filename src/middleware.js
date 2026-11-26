import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { PERFILES } from "@/lib/cuentasDemo";

const REGLAS = [
  { prefijo: "/proveedor", perfil: PERFILES.PROVEEDOR },
  { prefijo: "/ordenes", perfil: PERFILES.ORDENES },
  { prefijo: "/embarques", perfil: PERFILES.BODEGA },
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const regla = REGLAS.find(
    (r) => pathname === r.prefijo || pathname.startsWith(`${r.prefijo}/`)
  );

  if (!regla) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const usuario = await verifySessionToken(token);

  // El simulador de OC del portal Órdenes reutiliza este endpoint.
  if (pathname === "/proveedor/api/oc" && usuario?.perfil === PERFILES.ORDENES) {
    return NextResponse.next();
  }

  if (!usuario || usuario.perfil !== regla.perfil) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/proveedor/:path*", "/ordenes/:path*", "/embarques/:path*"],
};
