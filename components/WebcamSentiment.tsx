"use client";

import { useEffect, useRef, useState } from "react";

export type Sentiment = {
  dominant: string;
  frustration: number; // 0..1
  engagement: number;  // 0..1
};

// Error categories — each gets a different message and recovery option.
type ErrorKind =
  | "device_in_use"   // NotReadableError  → close other app/tab, retry
  | "permission"      // NotAllowedError   → user denied, browser settings
  | "no_device"       // NotFoundError     → no camera hardware
  | "models_missing"  // fetch 404         → run model download command
  | "unknown";

function classifyError(err: unknown): ErrorKind {
  if (!(err instanceof Error)) return "unknown";
  const name = err.name;
  const msg  = err.message.toLowerCase();
  if (name === "NotReadableError" || msg.includes("in use") || msg.includes("device in use"))
    return "device_in_use";
  if (name === "NotAllowedError" || msg.includes("permission") || msg.includes("denied"))
    return "permission";
  if (name === "NotFoundError" || msg.includes("not found") || msg.includes("no device"))
    return "no_device";
  if (msg.includes("404") || msg.includes("failed to fetch") || msg.includes("model"))
    return "models_missing";
  return "unknown";
}

const ERROR_COPY: Record<ErrorKind, { title: string; detail: string; canRetry: boolean }> = {
  device_in_use: {
    title: "Camera in use",
    detail: "Close any other tab or app that's using the camera, then retry.",
    canRetry: true,
  },
  permission: {
    title: "Camera access denied",
    detail: "Click the camera icon in your browser's address bar and allow access.",
    canRetry: true,
  },
  no_device: {
    title: "No camera found",
    detail: "Plug in a webcam or use a device with a built-in camera.",
    canRetry: false,
  },
  models_missing: {
    title: "Face model files missing",
    detail: "Run the model download command from the README (public/models/), then refresh.",
    canRetry: false,
  },
  unknown: {
    title: "Webcam unavailable",
    detail: "Mentor will run without visual sentiment — you can still chat normally.",
    canRetry: true,
  },
};

export default function WebcamSentiment({
  onSentiment,
}: {
  onSentiment?: (s: Sentiment) => void;
}) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);   // ← single source of truth for stream
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modelsReady = useRef(false);

  const [status, setStatus]             = useState<"off" | "loading" | "ready" | "error">("off");
  const [errorKind, setErrorKind]       = useState<ErrorKind | null>(null);
  const [lastSentiment, setLastSentiment] = useState<Sentiment | null>(null);

  // Centralised teardown — safe to call any time, even after unmount.
  function stopAll() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    // Detach from <video> if the element is still mounted.
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  useEffect(() => {
    // Cleanup on unmount — streamRef is always up-to-date, so this is safe.
    return () => stopAll();
  }, []);

  async function enable() {
    // If a stale stream is somehow still alive, kill it first.
    stopAll();
    setStatus("loading");
    setErrorKind(null);
    setLastSentiment(null);

    try {
      // Load face-api.js models lazily (cached after first load).
      if (!modelsReady.current) {
        const faceapi = await import("face-api.js");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        ]);
        modelsReady.current = true;
      }

      // Request camera — exact constraint so browsers don't try to use a
      // virtual/reserved device when a real one is busy.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for the video element to be ready before starting inference.
        await new Promise<void>((resolve, reject) => {
          const v = videoRef.current!;
          v.onloadedmetadata = () => v.play().then(resolve).catch(reject);
          v.onerror = reject;
        });
      }

      setStatus("ready");

      const faceapi = await import("face-api.js");
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
          if (!detection) return;

          const exprs = detection.expressions as unknown as Record<string, number>;
          const dominant = Object.entries(exprs).sort((a, b) => b[1] - a[1])[0][0];
          const frustration = (exprs.angry ?? 0) + (exprs.disgusted ?? 0) * 0.5;
          const engagement  = 1 - (exprs.neutral ?? 0) * 0.6;

          const s: Sentiment = { dominant, frustration, engagement };
          setLastSentiment(s);
          onSentiment?.(s);
        } catch {
          // Silent — a single missed frame is fine.
        }
      }, 2500);
    } catch (err) {
      console.error("[WebcamSentiment]", err);
      stopAll();
      setErrorKind(classifyError(err));
      setStatus("error");
    }
  }

  function disable() {
    stopAll();
    setStatus("off");
    setLastSentiment(null);
    setErrorKind(null);
  }

  const errInfo = errorKind ? ERROR_COPY[errorKind] : null;

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-700 bg-slate-900/50 w-full">
      {/* Video preview — always mounted so videoRef is stable */}
      <video
        ref={videoRef}
        muted
        playsInline
        className={`w-32 h-24 rounded-md bg-slate-800 object-cover transition-opacity ${
          status === "ready" ? "opacity-100" : "opacity-0 h-0 w-0 overflow-hidden"
        }`}
      />

      {status === "off" && (
        <button
          onClick={enable}
          className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 w-full"
        >
          👁 Enable webcam sentiment
        </button>
      )}

      {status === "loading" && (
        <span className="text-xs text-slate-400 animate-pulse">Loading face model…</span>
      )}

      {status === "ready" && (
        <div className="flex flex-col items-center gap-1 w-full">
          <span className="text-xs text-emerald-400 font-medium">
            {lastSentiment ? `😶 ${lastSentiment.dominant}` : "Watching…"}
          </span>
          {lastSentiment && (
            <div className="flex gap-2 text-[10px] text-slate-400">
              <span>😤 {Math.round(lastSentiment.frustration * 100)}%</span>
              <span>⚡ {Math.round(lastSentiment.engagement * 100)}%</span>
            </div>
          )}
          <button
            onClick={disable}
            className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 w-full mt-1"
          >
            Turn off
          </button>
        </div>
      )}

      {status === "error" && errInfo && (
        <div className="flex flex-col items-center gap-1.5 text-center w-full">
          <span className="text-xs text-amber-400 font-medium">{errInfo.title}</span>
          <span className="text-[11px] text-slate-400 leading-snug">{errInfo.detail}</span>
          <div className="flex gap-2 w-full mt-1">
            {errInfo.canRetry && (
              <button
                onClick={enable}
                className="flex-1 text-xs px-3 py-1 rounded bg-indigo-700 hover:bg-indigo-600"
              >
                Retry
              </button>
            )}
            <button
              onClick={disable}
              className="flex-1 text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
