export default function EmbarquesHeader({ tab, onTabChange }) {
  const tabs = [
    { id: "racks", label: "Acomodar en racks" },
    { id: "salida", label: "Salida / Embarques" },
  ];

  return (
    <header className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Racks y Embarques</h1>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Secciones de embarques">
        {tabs.map((t) => {
          const activo = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => onTabChange?.(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${
                activo
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
