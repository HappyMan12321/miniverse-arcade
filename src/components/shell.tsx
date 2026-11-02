import Link from "next/link";
import { Asterisk, Gamepad2 } from "lucide-react";
import { ThemeToggle } from "./theme-provider";
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="MiniVerse home">
      <span className="logo-mark">
        <Asterisk size={24} strokeWidth={2.8} />
      </span>
      mini<span className="logo-light">verse</span>
    </Link>
  );
}
export function Navbar() {
  return (
    <header className="nav-wrap">
      <nav className="nav container" aria-label="Main navigation">
        <Logo />
        <Link href="/#games" className="nav-arcade">
          <Gamepad2 size={18} /> Arcade
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
