"use client";

import { useState } from "react";
import VoiceChat from "@/components/VoiceChat";

export default function MentorPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession() {
    if (!name || !email) {
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
    } catch (err: any) {
      setError(err.message ?? "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 bg-slate-900 p-6 rounded-xl border border-slate-700">
          <h1 className="text-2xl font-bold">Start a Mentor Session</h1>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 outline-none"
          />
          <input
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 outline-none"
          />
          <input
            placeholder="Project name (optional)"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 outline-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={startSession}
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Starting…" : "Start Session"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Mentor Session</h1>
      <VoiceChat sessionId={sessionId} />
    </main>
  );
}
