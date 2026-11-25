import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "CEDIS WMS - Catlovers | De la OC al Embarque",
  description: "Sistema integral de gestión de recibo, validación QR y consolidación de embarques al 90%",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black">CEDIS</span>
              <span>Catlovers WMS</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/proveedor"
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition"
              >
                1-2. Portal Proveedor (Citas + QR)
              </Link>
              <Link
                href="/handheld"
                className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 transition font-medium"
              >
                3. Handheld Andén (Escáner QR)
              </Link>
              <Link
                href="/embarques"
                className="px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 transition font-medium"
              >
                4. Racks y Embarques
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
