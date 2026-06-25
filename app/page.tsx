import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-900">
          🧑‍🏫
        </div>
        <h1 className="text-4xl font-bold tracking-tight">AI Mentor</h1>
        <p className="max-w-lg text-slate-400 leading-relaxed">
          An open-source, multimodal AI mentor — voice in, voice out,
          RAG-grounded answers, webcam sentiment detection, talking avatar,
          and oral-defence panel simulation. Runs entirely on open-source
          models. No paid API keys needed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/mentor"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold shadow-lg shadow-indigo-900"
        >
          Start a Mentor Session
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition font-semibold"
        >
          Analytics Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 max-w-xl text-left">
        {[
          { icon: "🎤", label: "Voice in/out", sub: "Whisper + Speech Synthesis" },
          { icon: "👁",  label: "Sees you",    sub: "face-api.js, client-side only" },
          { icon: "🎭", label: "7 personas",   sub: "PM, Dev, Client, 3 panelists" },
          { icon: "📚", label: "RAG knowledge",sub: "pgvector on Supabase" },
        ].map((f) => (
          <div key={f.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className="text-sm font-semibold">{f.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{f.sub}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
