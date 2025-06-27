"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Contract {
  _id: string;
  title: string;
  content: string;
  parties: Array<{
    name: string;
    email: string;
    role: string;
    signed: boolean;
    signedAt?: string;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "draft" | "pending" | "completed"
  >("all");

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch("/api/contracts");
      if (!response.ok) {
        throw new Error("Failed to fetch contracts");
      }
      const data = await response.json();
      setContracts(data.contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      setError("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <svg
            className="w-5 h-5 text-green-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "pending":
        return (
          <svg
            className="w-5 h-5 text-yellow-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getDocumentIcon = () => (
    <svg
      className="w-12 h-12 text-blue-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 3v5a2 2 0 002 2h5"
      />
    </svg>
  );

  const filteredContracts = contracts
    .filter(
      (contract) => filterStatus === "all" || contract.status === filterStatus
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return past.toLocaleDateString();
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4" style={{ color: "var(--foreground)" }}>
            Loading contracts...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchContracts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header Bar */}
      <div
        className="border-b"
        style={{ borderColor: "rgba(128, 128, 128, 0.2)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1
              className="text-2xl font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Contracts
            </h1>
            {/* <Link
              href="/contracts/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Contract
            </Link> */}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="border-b"
        style={{ borderColor: "rgba(128, 128, 128, 0.2)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Filter Buttons */}
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(["all", "draft", "pending", "completed"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        filterStatus === status
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                      {status !== "all" && (
                        <span className="ml-1 text-xs">
                          ({contracts.filter((c) => c.status === status).length}
                          )
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 rounded-md border text-sm"
                style={{
                  borderColor: "rgba(128, 128, 128, 0.3)",
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                }}
              >
                <option value="date">Last modified</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md ${
                  viewMode === "list"
                    ? "bg-gray-200 dark:bg-gray-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-100"
                }`}
                title="List view"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md ${
                  viewMode === "grid"
                    ? "bg-gray-200 dark:bg-gray-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-100"
                }`}
                title="Grid view"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 mb-4 text-gray-300 dark:text-gray-600">
              {getDocumentIcon()}cl
            </div>
            <p
              className="text-lg font-medium mb-2"
              style={{ color: "var(--foreground)" }}
            >
              No {filterStatus !== "all" ? filterStatus : ""} contracts found
            </p>
            <p style={{ color: "var(--foreground)", opacity: 0.7 }}>
              {filterStatus === "all"
                ? "Create your first contract to get started."
                : `You don't have any contracts with "${filterStatus}" status.`}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredContracts.map((contract) => (
              <Link
                key={contract._id}
                href={`/contracts/${contract._id}`}
                className="group"
              >
                <div
                  className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
                  style={{
                    backgroundColor: "var(--background)",
                    borderColor: "rgba(128, 128, 128, 0.2)",
                  }}
                >
                  <div className="flex justify-center mb-3 text-blue-600 dark:text-blue-400">
                    {getDocumentIcon()}
                  </div>
                  <h3
                    className="font-medium text-center mb-2 line-clamp-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    {contract.title}
                  </h3>
                  <div className="mt-auto">
                    <div className="flex justify-center mb-2">
                      {getStatusIcon(contract.status)}
                    </div>
                    <p
                      className="text-xs text-center"
                      style={{ color: "var(--foreground)", opacity: 0.6 }}
                    >
                      {getTimeAgo(contract.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {/* Table Header */}
            <div
              className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium"
              style={{ color: "var(--foreground)", opacity: 0.7 }}
            >
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Signatures</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-1"></div>
            </div>

            {/* Table Rows */}
            {filteredContracts.map((contract) => (
              <Link
                key={contract._id}
                href={`/contracts/${contract._id}`}
                className="block"
              >
                <div
                  className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-50 transition-colors items-center"
                  style={{ color: "var(--foreground)" }}
                >
                  <div className="col-span-5 flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(contract.status)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{contract.title}</p>
                      {/* <p className="text-xs truncate" style={{ opacity: 0.6 }}>
                        {contract.parties.length} parties
                      </p> */}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        contract.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : contract.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {contract.status}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center space-x-1">
                      <div className="flex -space-x-2">
                        {contract.parties.slice(0, 3).map((party, index) => (
                          <div
                            key={index}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-900 ${
                              party.signed
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                            }`}
                            title={`${party.name} - ${
                              party.signed ? "Signed" : "Pending"
                            }`}
                          >
                            {party.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm" style={{ opacity: 0.7 }}>
                        {contract.parties.filter((p) => p.signed).length}/
                        {contract.parties.length}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm" style={{ opacity: 0.7 }}>
                      {getTimeAgo(contract.updatedAt)}
                    </p>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
