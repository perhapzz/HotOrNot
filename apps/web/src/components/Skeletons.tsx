export function AnalysisSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 animate-pulse">
      <div className="bg-white shadow-sm border-b h-16" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4" />
        <div className="h-6 bg-gray-200 rounded w-96 mx-auto mb-12" />
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-6" />
          <div className="h-12 bg-gray-200 rounded mb-4" />
          <div className="h-12 bg-gray-200 rounded w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 animate-pulse">
      <div className="bg-white shadow-sm border-b h-16" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="animate-pulse py-6">
      <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6 h-36" />
        ))}
      </div>
    </div>
  );
}
