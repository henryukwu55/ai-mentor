"use client";

import { useEffect, useRef, useState } from "react";

// Phase 2: "Seeing" the student. Uses face-api.js (MIT licensed, open
// source: https://github.com/justadudewhohacks/face-api.js) entirely in
// the browser — no frames are ever sent to a server. We detect the
// dominant facial expression every ~2s and surface a simple sentiment
// summary (e.g. "frustrated", "confused", "engaged") to the parent via
// onSentiment, which gets folded into the LLM's context.
//
// Setup: face-api.js needs model weight files. Download them once into
// /public/models from the project's official model repo, e.g.:
//   npx degit justadudewhohacks/face-api.js/weights public/models
// (documented in README). If models aren't present, this component fails
// gracefully and the mentor simply runs without visual sentiment.

export type Sentiment = {
  dominant: string; // e.g. "happy", "sad", "angry", "neutral", "surprised"
  frustration: number; // 0..1 heuristic score
  engagement: number; // 0..1 heuristic score
};

export default function WebcamSentiment({
  onSentiment,
}: {
  onSentiment?: (s: Sentiment) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "off">("off");
  const [lastSentiment, setLastSentiment] = useState<Sentiment | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function enable() {
    setStatus("loading");
    try {
      const faceapi = await import("face-api.js");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
        if (!detection) return;

        const expressions = detection.expressions as unknown as Record<string, number>;
        const dominant = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0][0];
        const frustration = (expressions.angry ?? 0) + (expressions.disgusted ?? 0) * 0.5;
        const engagement = 1 - (expressions.neutral ?? 0) * 0.6;

        const sentiment: Sentiment = { dominant, frustration, engagement };
        setLastSentiment(sentiment);
        onSentiment?.(sentiment);
      }, 2500);
    } catch (err) {
      console.error("Webcam sentiment unavailable:", err);
      setStatus("unavailable");
    }
  }

  function disable() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | undefined;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("off");
    setLastSentiment(null);
  }

  useEffect(() => () => disable(), []);

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-700 bg-slate-900/50">
      <video
        ref={videoRef}
        muted
        playsInline
        className={`w-32 h-24 rounded-md bg-slate-800 object-cover ${
          status === "ready" ? "" : "opacity-30"
        }`}
      />
      {status === "off" && (
        <button
          onClick={enable}
          className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
        >
          Enable webcam sentiment
        </button>
      )}
      {status === "loading" && <span className="text-xs text-slate-400">Loading face model…</span>}
      {status === "unavailable" && (
        <span className="text-xs text-amber-400 text-center">
          Webcam/model unavailable. Mentor will run without visual sentiment.
        </span>
      )}
      {status === "ready" && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-slate-400">
            {lastSentiment ? `Detected: ${lastSentiment.dominant}` : "Watching…"}
          </span>
          <button onClick={disable} className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">
            Turn off
          </button>
        </div>
      )}
    </div>
  );
}
