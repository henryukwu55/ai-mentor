"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage } from "@/lib/ollama";
import { PERSONAS, getPersona } from "@/lib/personas";
import Avatar from "./Avatar";
import WebcamSentiment, { type Sentiment } from "./WebcamSentiment";

type Turn = { role: "user" | "assistant"; content: string; personaId?: string };

// Prefer opus inside webm for Chromium; fall back to browser default.
// Safari records as mp4/aac which AudioContext can also decode.
function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export default function VoiceChat({ sessionId }: { sessionId: string }) {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const persona = getPersona(personaId);

  const [defenseMode,  setDefenseMode]  = useState(false);
  // Use a ref so the stale-closure inside sendMessage always sees the
  // current index, even when called from within the same render cycle.
  const defenseIndexRef = useRef(0);
  const [defenseIndexDisplay, setDefenseIndexDisplay] = useState(0);
  const defensePanel = ["defense_theory", "defense_code", "defense_system"];

  const [turns,          setTurns]          = useState<Turn[]>([{
    role: "assistant",
    content: "Hi! I'm your AI mentor. Click 🎤 to speak, or type below. Switch my persona with the dropdown, or start an Oral Defence session.",
    personaId: PERSONAS[0].id,
  }]);
  const [textInput,       setTextInput]       = useState("");
  const [recording,       setRecording]       = useState(false);
  const [busy,            setBusy]            = useState(false);
  const [speaking,        setSpeaking]        = useState(false);
  const [whisperLoading,  setWhisperLoading]  = useState(false);
  const [sentiment,       setSentiment]       = useState<Sentiment | null>(null);
  const [micError,        setMicError]        = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const mimeTypeRef      = useRef("");
  const transcriberRef   = useRef<any>(null);
  const scrollRef        = useRef<HTMLDivElement>(null);
  // Keep a ref so sendMessage's closure always reads the live personaId.
  const personaIdRef     = useRef(personaId);
  const defenseModeRef   = useRef(false);

  useEffect(() => { personaIdRef.current  = personaId;    }, [personaId]);
  useEffect(() => { defenseModeRef.current = defenseMode; }, [defenseMode]);

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  // ─── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, p = persona) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = p.voice.rate;
    u.pitch = p.voice.pitch;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [persona]);

  // Cancel TTS on persona switch
  useEffect(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [personaId]);

  // ─── Avatar expression ──────────────────────────────────────────────────────
  function expressionFromSentiment(): "neutral" | "happy" | "concerned" | "stern" {
    const sternPersonas = ["pm","senior_dev","defense_theory","defense_code","defense_system"];
    if (sentiment?.frustration && sentiment.frustration > 0.4) return "concerned";
    if (sentiment?.dominant === "happy") return "happy";
    if (sternPersonas.includes(personaId)) return "stern";
    return "neutral";
  }

  // ─── Send message ────────────────────────────────────────────────────────────
  // Uses refs for defenseMode/Index so it is never stale inside async callbacks.
  async function sendMessage(message: string) {
    if (!message.trim() || busy) return;
    setBusy(true);
    setMicError(null);

    const activePid    = personaIdRef.current;
    const activePersona = getPersona(activePid);

    const nextTurns: Turn[] = [
      ...turns,
      { role: "user", content: message },
    ];
    setTurns(nextTurns);
    setTextInput("");

    try {
      const history: ChatMessage[] = nextTurns
        .slice(0, -1)
        .map((t) => ({ role: t.role, content: t.content }));

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message,
          history,
          systemPrompt: activePersona.systemPrompt,
          sentiment,
        }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data  = await res.json();
      const reply = data.reply ?? "Sorry, something went wrong.";

      setTurns((prev) => [...prev, { role: "assistant", content: reply, personaId: activePid }]);
      speak(reply, activePersona);

      // Defense mode: rotate to next panelist using ref so the index is fresh.
      if (defenseModeRef.current) {
        const nextIdx = (defenseIndexRef.current + 1) % defensePanel.length;
        defenseIndexRef.current = nextIdx;
        setDefenseIndexDisplay(nextIdx);
        setPersonaId(defensePanel[nextIdx]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setTurns((prev) => [...prev, {
        role: "assistant",
        content: `⚠️ ${msg}. Is Ollama running? Run: \`ollama serve\``,
        personaId: activePid,
      }]);
    } finally {
      setBusy(false);
    }
  }

  // ─── Defense mode ───────────────────────────────────────────────────────────
  function startDefenseMode() {
    defenseIndexRef.current = 0;
    setDefenseIndexDisplay(0);
    setDefenseMode(true);
    defenseModeRef.current = true;
    const first   = getPersona(defensePanel[0]);
    setPersonaId(defensePanel[0]);
    const opening = "Welcome to your oral defence. We are three panelists — Theory, Code, and System Design — and will question you in turn. Please introduce your project.";
    setTurns((prev) => [...prev, { role: "assistant", content: opening, personaId: defensePanel[0] }]);
    speak(opening, first);
  }

  function stopDefenseMode() {
    setDefenseMode(false);
    defenseModeRef.current = false;
    setPersonaId(PERSONAS[0].id);
  }

  // ─── Whisper STT ────────────────────────────────────────────────────────────
  async function getTranscriber() {
    if (transcriberRef.current) return transcriberRef.current;
    setWhisperLoading(true);
    try {
      const { pipeline } = await import("@xenova/transformers");
      transcriberRef.current = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
    } finally {
      setWhisperLoading(false);
    }
    return transcriberRef.current;
  }

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick the best supported container/codec at record time.
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Mic unavailable");
      if (e.name === "NotAllowedError")    setMicError("Microphone access denied — allow it in browser settings.");
      else if (e.name === "NotReadableError") setMicError("Microphone in use by another app — close it and retry.");
      else setMicError(`Could not access microphone: ${e.message}`);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  async function handleRecordingStop() {
    setBusy(true);
    try {
      const mimeType = mimeTypeRef.current || "audio/webm";
      const blob        = new Blob(chunksRef.current, { type: mimeType });
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx    = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const audioData   = audioBuffer.getChannelData(0);
      audioCtx.close();

      const transcriber = await getTranscriber();
      const result      = await transcriber(audioData);
      const text        = (result?.text ?? "").trim();
      if (text) await sendMessage(text);
      else setMicError("Nothing transcribed — speak clearly and try again.");
    } catch (err) {
      console.error("Transcription error:", err);
      setMicError("Transcription failed — check the browser console for details.");
    } finally {
      setBusy(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">

      {/* ── Sidebar ── */}
      <div className="flex flex-col items-center gap-3">
        <Avatar
          color={persona.avatarColor}
          speaking={speaking}
          expression={expressionFromSentiment()}
          label={persona.label}
        />

        {!defenseMode ? (
          <>
            <select
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="w-full text-sm px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-indigo-500 outline-none"
            >
              {PERSONAS.filter((p) => !p.id.startsWith("defense_")).map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 text-center leading-snug">{persona.description}</p>
            <button
              onClick={startDefenseMode}
              className="text-xs w-full px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 transition font-medium"
            >
              🎓 Oral Defence Panel
            </button>
          </>
        ) : (
          <div className="text-center space-y-2 w-full">
            <div className="text-xs text-purple-300 bg-purple-950/50 border border-purple-800 rounded-lg px-2 py-1.5">
              Defence — panelist {defenseIndexDisplay + 1} / 3
            </div>
            <button
              onClick={stopDefenseMode}
              className="text-xs w-full px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
            >
              Exit defence mode
            </button>
          </div>
        )}

        <WebcamSentiment onSentiment={setSentiment} />
      </div>

      {/* ── Chat panel ── */}
      <div className="flex flex-col h-[72vh] border border-slate-700 rounded-2xl overflow-hidden shadow-xl">

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/80">
          {turns.map((t, i) => (
            <div
              key={i}
              className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed animate-fade-in ${
                t.role === "user"
                  ? "ml-auto bg-indigo-600 text-white rounded-br-sm"
                  : "mr-auto bg-slate-800 text-slate-100 rounded-bl-sm"
              }`}
            >
              {t.role === "assistant" && t.personaId && (
                <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-medium">
                  {getPersona(t.personaId).label}
                </div>
              )}
              {t.content}
            </div>
          ))}

          {busy && (
            <div className="mr-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-bl-sm bg-slate-800 text-slate-400 text-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </span>
              Thinking…
            </div>
          )}
        </div>

        {/* Mic error banner */}
        {micError && (
          <div className="px-4 py-2 bg-amber-950/60 border-t border-amber-800 text-amber-300 text-xs flex items-center justify-between">
            <span>{micError}</span>
            <button onClick={() => setMicError(null)} className="ml-2 text-amber-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Whisper loading banner */}
        {whisperLoading && (
          <div className="px-4 py-2 bg-indigo-950/60 border-t border-indigo-800 text-indigo-300 text-xs animate-pulse">
            Loading Whisper model in your browser (one-time, ~40 MB)…
          </div>
        )}

        {/* Input row */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700 flex items-center gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={busy || whisperLoading}
            title={recording ? "Stop recording" : "Start voice input"}
            className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl font-medium transition ${
              recording
                ? "bg-red-600 hover:bg-red-500 animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-500"
            } disabled:opacity-40`}
          >
            {recording ? "⏹" : "🎤"}
          </button>
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(textInput)}
            placeholder={recording ? "Recording… click ⏹ to stop" : "Type a question or click 🎤 to speak…"}
            disabled={busy || recording}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-indigo-500 transition text-sm disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(textInput)}
            disabled={busy || !textInput.trim() || recording}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition text-lg"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
