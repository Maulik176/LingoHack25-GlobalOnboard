import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlobalOnboard",
  description:
    "GlobalOnboard lets HR teams create one onboarding checklist and preview it in multiple languages via Lingo.dev.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
