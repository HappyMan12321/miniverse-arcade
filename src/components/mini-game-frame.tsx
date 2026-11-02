"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CircleHelp, Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
export function MiniGameFrame({
  title,
  help,
  toolbar,
  stats,
  children,
  onHelpChange,
}: {
  title: string;
  help: React.ReactNode;
  toolbar: React.ReactNode;
  stats: React.ReactNode;
  children: React.ReactNode;
  onHelpChange?: (open: boolean) => void;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const change = (open: boolean) => {
    setShowHelp(open);
    onHelpChange?.(open);
  };
  return (
    <main id="main" className="game-page container">
      <header className="game-heading">
        <Link
          href="/#games"
          className="back-button"
          aria-label="Back to the arcade"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1>{title}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => change(true)}
          aria-label="How to play"
          title="How to play"
        >
          <CircleHelp size={21} />
        </Button>
      </header>
      <div className="game-workspace">
        <section className="game-hud" aria-label="Game stats">
          {stats}
        </section>
        <div className="mini-toolbar">{toolbar}</div>
        <div className="mini-play-area">{children}</div>
      </div>
      <Dialog
        open={showHelp}
        onOpenChange={change}
        title="How to play"
        description={title}
      >
        <div className="help-content">{help}</div>
        <Button onClick={() => change(false)}>Done</Button>
      </Dialog>
    </main>
  );
}
export function GameStat({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | number;
  testId?: string;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong data-testid={testId}>{value}</strong>
    </div>
  );
}
export function BestStat({
  label = "Best",
  value,
}: {
  label?: string;
  value: string | number | null;
}) {
  return (
    <div className="stat best-stat">
      <span>
        <Trophy size={12} />
        {label}
      </span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}
