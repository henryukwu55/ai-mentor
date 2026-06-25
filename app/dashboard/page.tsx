"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SessionRow = {
  id: string;
  project_name: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  students: { full_name: string; email: string } | null;
  avgFrustration: number | null;
  avgEngagement: number | null;
};

function badge(label: string, value: number | null, danger: boolean) {
  if (value === null) return <span className="text-slate-500 text-xs">—</span>;
  const pct = Math.round(value * 100);
  const color = danger
    ? pct > 50
      ? "text-red-400"
      : pct > 25
      ? "text-amber-400"
      : "text-emerald-400"
    : pct > 60
    ? "text-emerald-400"
    : pct > 30
    ? "text-amber-400"
    : "text-red-400";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {label} {pct}%
    </span>
  );
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setSessions(d.sessions);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-slate-400 hover:text-slate-200 text-sm">← Home</Link>
        <button
          onClick={() => window.location.reload()}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
        >
          ↻ Refresh
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-1">Mentor Analytics</h1>
      <p className="text-slate-400 text-sm mb-6">
        Recent sessions, with average visual-sentiment signal captured during each conversation
        (Phase 2 webcam detection). Use this to spot consistently high-frustration sessions that
        may need a human mentor follow-up.
      </p>

      {error && <p className="text-red-400">{error}</p>}
      {!sessions && !error && <p className="text-slate-400">Loading…</p>}

      {sessions && sessions.length === 0 && (
        <p className="text-slate-400">No sessions yet — start one from the Mentor page.</p>
      )}

      {sessions && sessions.length > 0 && (
        <div className="overflow-x-auto border border-slate-700 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="text-left px-4 py-2">Student</th>
                <th className="text-left px-4 py-2">Project</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Started</th>
                <th className="text-left px-4 py-2">Frustration</th>
                <th className="text-left px-4 py-2">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-800">
                  <td className="px-4 py-2">{s.students?.full_name ?? "—"}</td>
                  <td className="px-4 py-2">{s.project_name ?? "—"}</td>
                  <td className="px-4 py-2 capitalize">{s.status}</td>
                  <td className="px-4 py-2">{new Date(s.started_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{badge("", s.avgFrustration, true)}</td>
                  <td className="px-4 py-2">{badge("", s.avgEngagement, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
