"use client";

import { useState } from "react";

export default function AuditTable({ logs: initialLogs, initialPage }) {
  const [logs, setLogs] = useState(initialLogs);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  async function loadPage(newPage) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${newPage}&limit=50`);
      const data = await res.json();
      setLogs(data.logs);
      setPage(newPage);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Time</th>
              <th className="text-left px-4 py-3 font-medium">Actor</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Target</th>
              <th className="text-left px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {String(log.createdAt).replace("T", " ").slice(0, 19)}
                </td>
                <td className="px-4 py-3">{log.actorUsername || "System"}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                    {log.actionType}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {log.targetType && `${log.targetType}:${log.targetId}`}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {log.metadata ? JSON.stringify(log.metadata) : ""}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => loadPage(page - 1)}
          disabled={page <= 1 || loading}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">Page {page}</span>
        <button
          onClick={() => loadPage(page + 1)}
          disabled={logs.length < 50 || loading}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
