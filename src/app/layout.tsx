import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentry Demo — QA Evaluation",
  description: "Interactive demo of Sentry.io features for the 'Should we integrate Sentry?' decision",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen font-sans antialiased">
        <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl font-bold text-violet-400">Sentry Demo</span>
          <span className="text-gray-500 text-sm">QA Evaluation · werkdone</span>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
