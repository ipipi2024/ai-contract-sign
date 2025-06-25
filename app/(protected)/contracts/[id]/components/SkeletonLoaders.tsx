"use client";

const SkeletonBlock = () => (
  <div className="mb-2 p-4 rounded border border-gray-200 bg-white animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="flex space-x-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-blue-100 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
    </div>
  </div>
);

const SkeletonSummary = () => (
  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const SkeletonSendPanel = () => (
  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md animate-pulse">
    <div className="h-12 bg-gray-200 rounded mb-3"></div>
    <div className="h-12 bg-gray-200 rounded"></div>
  </div>
);

export const SkeletonLoaders = () => (
  <div className="flex flex-1 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 lg:space-x-6 h-0">
    <div className="w-full lg:w-7/12 flex-1 overflow-y-auto pb-4 lg:pr-2">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 sm:w-64 mb-4 animate-pulse"></div>
        <div className="text-sm text-gray-500 mb-4">Generating your contract...</div>
      </div>
      {[...Array(4)].map((_, i) => (
        <SkeletonBlock key={i} />
      ))}
    </div>

    <div className="hidden lg:block lg:w-5/12 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <SkeletonSummary />
      </div>
      <div className="mt-4">
        <SkeletonSendPanel />
      </div>
    </div>
  </div>
);