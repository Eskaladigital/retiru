// Loading state for public pages (ES)
export default function PublicLoading() {
  return (
    <div className="container-wide py-12">
      <div className="animate-pulse space-y-6">
        {/* Title skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-sand-200 rounded-xl w-72" />
          <div className="h-4 bg-sand-100 rounded-lg w-96" />
        </div>
        {/* Cards skeleton */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
              <div className="aspect-[16/10] bg-sand-100" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-sand-100 rounded w-20" />
                <div className="h-5 bg-sand-200 rounded-lg w-full" />
                <div className="h-3 bg-sand-100 rounded w-3/4" />
                <div className="h-6 bg-sand-200 rounded-lg w-24 mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
