// Loading state for administrator panel
export default function AdministratorLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 bg-sand-200 rounded-xl w-40" />
        <div className="h-10 bg-sand-200 rounded-xl w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-sand-200 rounded-2xl p-5 space-y-3">
            <div className="h-3 bg-sand-100 rounded w-24" />
            <div className="h-7 bg-sand-200 rounded-lg w-20" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="h-12 bg-sand-50 border-b border-sand-200" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-sand-100">
            <div className="h-4 bg-sand-200 rounded w-32" />
            <div className="h-4 bg-sand-100 rounded w-20" />
            <div className="h-4 bg-sand-100 rounded w-16 ml-auto" />
            <div className="h-5 bg-sand-100 rounded-full w-14" />
            <div className="h-4 bg-sand-100 rounded w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
