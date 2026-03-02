// Loading state for dashboard pages
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 bg-sand-200 rounded-xl w-56" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-sand-200 rounded-2xl p-6 space-y-3">
            <div className="h-3 bg-sand-100 rounded w-24" />
            <div className="h-7 bg-sand-200 rounded-lg w-20" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-sand-200 rounded-2xl p-6 space-y-4">
        <div className="h-5 bg-sand-200 rounded-lg w-32" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-sand-100">
            <div className="w-12 h-12 bg-sand-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-sand-200 rounded w-3/4" />
              <div className="h-3 bg-sand-100 rounded w-1/2" />
            </div>
            <div className="h-6 bg-sand-100 rounded-lg w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
