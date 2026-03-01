import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tether | The AI Expert That Cites Its Sources",
  description:
    "Hot-swappable AI expert plugins for enterprise. Legal, Healthcare, Engineering. Every claim verified. Every fact cited. Zero hallucinations.",
  keywords: [
    "AI plugins",
    "enterprise AI",
    "RAG",
    "hallucination-free",
    "developer tools",
  ],
  openGraph: {
    title: "Tether | The AI Expert That Cites Its Sources",
    description:
      "Hot-swappable AI expert plugins for enterprise. Zero hallucinations.",
    type: "website",
  },
  icons: {
    icon: "/tether-icon.svg?v=3",
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
