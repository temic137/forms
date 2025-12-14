export function FormLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      
      {/* Field skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      
      {/* Button skeleton */}
      <div className="h-12 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export function BuilderLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="h-12 bg-gray-200 rounded w-1/2"></div>
      
      {/* Field list skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AILoadingSpinner({ message = "Processing..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}

export function InlineLoadingSpinner() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative w-4 h-4">
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
