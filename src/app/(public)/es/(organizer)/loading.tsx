// Loading state for organizer panel
export default function PanelLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 bg-sand-200 rounded-xl w-48" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-sand-200 rounded-2xl p-5 space-y-3">
            <div className="h-3 bg-sand-100 rounded w-20" />
            <div className="h-7 bg-sand-200 rounded-lg w-16" />
            <div className="h-2 bg-sand-100 rounded w-24" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-sand-200"><div className="h-5 bg-sand-200 rounded-lg w-36" /></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-sand-100">
            <div className="w-10 h-10 bg-sand-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-sand-200 rounded w-48" />
              <div className="h-3 bg-sand-100 rounded w-32" />
            </div>
            <div className="h-5 bg-sand-100 rounded-full w-16" />
            <div className="h-4 bg-sand-100 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
