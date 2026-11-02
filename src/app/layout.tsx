import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "MiniVerse Arcade",
    template: "%s · MiniVerse",
  },
  description:
    "Play Maze Explorer, Memory Match, Snake, and 2048. Free browser games with keyboard and touch controls.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
