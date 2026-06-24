"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/ollama";
import { PERSONAS, getPersona } from "@/lib/personas";
import Avatar from "./Avatar";
import WebcamSentiment, { type Sentiment } from "./WebcamSentiment";

type Turn = { role: "user" | "assistant"; content: string; personaId?: string };

// Phase 1 (voice) + Phase 2 (webcam sentiment) + Phase 3 (talking avatar) +
// Phase 4 (persona role-play) all come together here.
//
// STT: Whisper-tiny via @xenova/transformers, runs fully in-browser (WASM),
// no API key, no server round-trip.
// TTS: browser SpeechSynthesis API, voice pitch/rate tuned per persona.

export default function VoiceChat({ sessionId }: { sessionId: string }) {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const persona = getPersona(personaId);

  const [defenseMode, setDefenseMode] = useState(false);
  const [defenseIndex, setDefenseIndex] = useState(0);
  const defensePanel = ["defense_theory", "defense_code", "defense_system"];

  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI mentor. Click the mic and tell me what you're stuck on, or type below.",
      personaId: PERSONAS[0].id,
    },
  ]);
  const [textInput, setTextInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcriberReady, setTranscriberReady] = useState(false);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriberRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function getTranscriber() {
    if (transcriberRef.current) return transcriberRef.current;
    const { pipeline } = await import("@xenova/transformers");
    const transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny.en"
    );
    transcriberRef.current = transcriber;
    setTranscriberReady(true);
    return transcriber;
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  function speak(text: string, p = persona) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = p.voice.rate;
    utterance.pitch = p.voice.pitch;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function expressionFromSentiment(): "neutral" | "happy" | "concerned" | "stern" {
    if (!sentiment) return "neutral";
    if (sentiment.frustration > 0.4) return "concerned";
    if (sentiment.dominant === "happy") return "happy";
    if (["pm", "senior_dev", "defense_theory", "defense_code", "defense_system"].includes(personaId))
      return "stern";
    return "neutral";
  }

  async function sendMessage(message: string, activePersona = persona) {
    if (!message.trim() || busy) return;
    setBusy(true);
    const nextTurns: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(nextTurns);
    setTextInput("");

    try {
      const history: ChatMessage[] = nextTurns
        .slice(0, -1)
        .map((t) => ({ role: t.role, content: t.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message,
          history,
          systemPrompt: activePersona.systemPrompt,
          sentiment,
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Sorry, I hit an error processing that.";
      setTurns((prev) => [...prev, { role: "assistant", content: reply, personaId: activePersona.id }]);
      speak(reply, activePersona);

      // Oral defense mode: rotate to the next panelist after each answer
      if (defenseMode) {
        const nextIdx = (defenseIndex + 1) % defensePanel.length;
        setDefenseIndex(nextIdx);
        setPersonaId(defensePanel[nextIdx]);
      }
    } catch (err) {
      console.error(err);
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: "I couldn't reach the mentor service. Is Ollama running?" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function startDefenseMode() {
    setDefenseMode(true);
    setDefenseIndex(0);
    const first = getPersona(defensePanel[0]);
    setPersonaId(first.id);
    const opening =
      "Welcome to your oral defense. We are three panelists — Theory, Code, and System Design — and we'll take turns questioning your project. Please introduce your project briefly.";
    setTurns((prev) => [...prev, { role: "assistant", content: opening, personaId: first.id }]);
    speak(opening, first);
  }

  function stopDefenseMode() {
    setDefenseMode(false);
    setPersonaId(PERSONAS[0].id);
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorder.onstop = handleRecordingStop;
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  async function handleRecordingStop() {
    setBusy(true);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);

      const transcriber = await getTranscriber();
      const result = await transcriber(audioData);
      const text = (result?.text ?? "").trim();
      if (text) await sendMessage(text);
    } catch (err) {
      console.error("Transcription failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
      {/* Sidebar: avatar, persona picker, webcam sentiment */}
      <div className="flex flex-col items-center gap-4">
        <Avatar color={persona.avatarColor} speaking={speaking} expression={expressionFromSentiment()} label={persona.label} />

        {!defenseMode ? (
          <>
            <select
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="w-full text-sm px-2 py-2 rounded-lg bg-slate-800 border border-slate-700"
            >
              {PERSONAS.filter((p) => !p.id.startsWith("defense_")).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 text-center">{persona.description}</p>
            <button
              onClick={startDefenseMode}
              className="text-xs w-full px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-600"
            >
              🎓 Start Oral Defense Panel
            </button>
          </>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-xs text-purple-300">
              Oral Defense Mode — panelist {defenseIndex + 1}/3
            </p>
            <button
              onClick={stopDefenseMode}
              className="text-xs w-full px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
            >
              Exit defense mode
            </button>
          </div>
        )}

        <WebcamSentiment onSentiment={setSentiment} />
      </div>

      {/* Chat panel */}
      <div className="flex flex-col h-[70vh] border border-slate-700 rounded-xl overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
          {turns.map((t, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                t.role === "user"
                  ? "ml-auto bg-indigo-600 text-white"
                  : "mr-auto bg-slate-800 text-slate-100"
              }`}
            >
              {t.role === "assistant" && t.personaId && (
                <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
                  {getPersona(t.personaId).label}
                </div>
              )}
              {t.content}
            </div>
          ))}
          {busy && <div className="text-slate-400 text-sm">Mentor is thinking…</div>}
        </div>

        <div className="p-3 bg-slate-800 flex items-center gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={busy}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              recording ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"
            } disabled:opacity-50`}
          >
            {recording ? "⏹ Stop" : "🎤 Speak"}
          </button>
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(textInput)}
            placeholder="Or type your question…"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none"
          />
          <button
            onClick={() => sendMessage(textInput)}
            disabled={busy || !textInput.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {!transcriberReady && (
          <p className="text-xs text-slate-500 px-3 pb-2">
            (Whisper model loads in your browser the first time you hit the mic — a few seconds.)
          </p>
        )}
      </div>
    </div>
  );
}
