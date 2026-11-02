import Link from "next/link";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { ThemeToggle } from "./theme-provider";
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="MiniVerse home">
      <span className="logo-mark">
        <Asterisk size={25} strokeWidth={2.8} />
      </span>
      mini<span className="logo-light">verse</span>
      <span className="logo-period">.</span>
    </Link>
  );
}
export function Navbar() {
  return (
    <header className="nav-wrap">
      <nav className="nav container" aria-label="Main navigation">
        <Logo />
        <div className="nav-links">
          <Link href="/#games">The arcade</Link>
          <Link href="/#about">
            Our little universe <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="nav-actions">
          <span className="online-dot" />{" "}
          <span className="nav-status">A little play, every day</span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer container">
      <Logo />
      <span>Small games. A little escape.</span>
      <div>
        <span>Made for the joy of it</span>
        <span className="footer-star">✳</span>
        <span>© {new Date().getFullYear()} MiniVerse</span>
      </div>
    </footer>
  );
}
