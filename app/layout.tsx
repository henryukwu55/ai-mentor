import "./globals.css";
import type { ReactNode } from "react";

// Using system-UI font stack — zero external network calls at build or
// runtime. This is consistent with the project's fully self-hosted, no
// external-API philosophy. Looks great on macOS (SF Pro), Windows (Segoe UI),
// Linux (Noto Sans) and Android/Chrome (Roboto).

export const metadata = {
  title: "AI Mentor",
  description: "Open-source multimodal AI mentor for students",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
