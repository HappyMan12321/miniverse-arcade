import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar, Footer } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "MiniVerse — Small games. Big little escapes.",
    template: "%s · MiniVerse",
  },
  description:
    "A thoughtfully made collection of browser games. Step into Maze Explorer, find your flow, and make a little room for play.",
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
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
