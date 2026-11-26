import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "CEDIS MJJO | Sistema Integral WMS · De la OC al Embarque",
  description: "CEDIS MJJO - Sistema integral de gestión de recibo, validación QR y consolidación de embarques al 90%",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight group">
              <span className="bg-amber-500 group-hover:bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-md font-black tracking-wider transition">
                CEDIS
              </span>
              <span className="font-extrabold tracking-wide text-white">MJJO</span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-slate-800 text-amber-400 border border-slate-700 px-2 py-0.5 rounded">
                WMS · YMS
              </span>
            </Link>

          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
