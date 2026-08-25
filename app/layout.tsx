import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://np-sde-assessment.arnovkandlikar.chatgpt.site"),
  title: "Taskify - Race Control for Work",
  description: "A fast, motorsport-inspired Kanban board that keeps projects moving.",
  openGraph: {
    title: "TASKIFY",
    description: "Work at race pace.",
    url: "https://np-sde-assessment.arnovkandlikar.chatgpt.site",
    siteName: "Taskify",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "Taskify - Work at race pace.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TASKIFY",
    description: "Work at race pace.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
