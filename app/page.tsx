import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold">AI Mentor</h1>
      <p className="max-w-xl text-slate-300">
        An open-source, multimodal AI mentor: voice in, voice out, RAG-grounded
        answers, running entirely on open-source models (Ollama + Whisper via
        Transformers.js) and Supabase Postgres.
      </p>
      <Link
        href="/mentor"
        className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
      >
        Start a Mentor Session
      </Link>
      <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200 underline">
        View analytics dashboard
      </Link>
    </main>
  );
}
