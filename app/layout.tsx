import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI Mentor",
  description: "Open-source multimodal AI mentor for students",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
