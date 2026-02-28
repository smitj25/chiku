import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SME-Plug | The AI Expert That Cites Its Sources",
  description:
    "Hot-swappable AI expert plugins for enterprise. Legal, Healthcare, Engineering. Every claim verified. Every fact cited. Zero hallucinations.",
  keywords: [
    "AI plugins",
    "enterprise AI",
    "RAG",
    "hallucination-free",
    "SME",
    "developer tools",
  ],
  openGraph: {
    title: "SME-Plug | The AI Expert That Cites Its Sources",
    description:
      "Hot-swappable AI expert plugins for enterprise. Zero hallucinations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
