// components/dashboard/LoadingState.tsx
export function LoadingState() {
  return (
    <div className="animate-pulse p-6 sm:p-8 lg:p-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}