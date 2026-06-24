"use client";

import { useEffect, useRef, useState } from "react";

// A dependency-free "talking avatar": an SVG face whose mouth opens/closes
// in sync with the TTS audio amplitude, and whose expression reflects the
// current detected student sentiment (from WebcamSentiment) and persona.
// This avoids paid avatar services (D-ID/HeyGen) entirely while still
// delivering Phase 3's "face-to-face" feel.

type Expression = "neutral" | "happy" | "concerned" | "stern";

export default function Avatar({
  color,
  speaking,
  expression = "neutral",
  label,
}: {
  color: string;
  speaking: boolean;
  expression?: Expression;
  label: string;
}) {
  const [mouthOpen, setMouthOpen] = useState(0); // 0..1
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!speaking) {
      setMouthOpen(0);
      return;
    }
    // Simple synthetic "talk" animation: oscillate mouth openness while
    // speech is active. (Real amplitude-driven sync is wired up in
    // VoiceChat via the Web Audio API when using server-side TTS.)
    let t = 0;
    const animate = () => {
      t += 0.25;
      setMouthOpen(Math.abs(Math.sin(t)) * 0.8 + 0.1);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speaking]);

  const eyebrowY = expression === "stern" ? 38 : expression === "concerned" ? 36 : 34;
  const browAngle = expression === "stern" ? -6 : expression === "concerned" ? 4 : 0;
  const smileCurve =
    expression === "happy" ? 18 : expression === "stern" ? -8 : expression === "concerned" ? -3 : 6;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 200 200" className="w-32 h-32 drop-shadow-lg">
        <circle cx="100" cy="100" r="90" fill={color} opacity={0.15} />
        <circle cx="100" cy="100" r="70" fill={color} opacity={0.9} />
        {/* eyes */}
        <circle cx="75" cy="90" r="6" fill="white" />
        <circle cx="125" cy="90" r="6" fill="white" />
        <circle cx="75" cy="90" r="2.5" fill="#0f172a" />
        <circle cx="125" cy="90" r="2.5" fill="#0f172a" />
        {/* eyebrows (expression) */}
        <line
          x1="64" y1={eyebrowY} x2="86" y2={eyebrowY - browAngle}
          stroke="#0f172a" strokeWidth="3" strokeLinecap="round"
        />
        <line
          x1="114" y1={eyebrowY - browAngle} x2="136" y2={eyebrowY}
          stroke="#0f172a" strokeWidth="3" strokeLinecap="round"
        />
        {/* mouth: morphs between a curve (idle/expression) and an ellipse (speaking) */}
        {speaking ? (
          <ellipse
            cx="100"
            cy={128 + mouthOpen * 4}
            rx={16}
            ry={4 + mouthOpen * 14}
            fill="#0f172a"
          />
        ) : (
          <path
            d={`M 75 128 Q 100 ${128 + smileCurve} 125 128`}
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
      <span className="text-sm text-slate-300 font-medium">{label}</span>
    </div>
  );
}
