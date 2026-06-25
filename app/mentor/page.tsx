"use client";

import { useState } from "react";
import Link from "next/link";
import VoiceChat from "@/components/VoiceChat";

export default function MentorPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function startSession() {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: name, studentEmail: email, projectName: project }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSessionId(data.sessionId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-slate-400 hover:text-slate-200 text-sm">← Home</Link>
          </div>
          <h1 className="text-2xl font-bold">Start a Session</h1>
          <p className="text-sm text-slate-400">
            Your session is recorded so your mentor can reference your history.
          </p>

          <div className="space-y-2">
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-indigo-500 transition"
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-indigo-500 transition"
            />
            <input
              placeholder="Project name (optional)"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-indigo-500 transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={startSession}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold transition"
          >
            {loading ? "Starting…" : "Start Session →"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-4 p-4 md:p-6">
      <div className="w-full max-w-4xl flex items-center justify-between">
        <Link href="/" className="text-slate-400 hover:text-slate-200 text-sm">← Home</Link>
        <h1 className="text-lg font-semibold">Mentor Session</h1>
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-200 text-sm">Dashboard →</Link>
      </div>
      <VoiceChat sessionId={sessionId} />
    </main>
  );
}
