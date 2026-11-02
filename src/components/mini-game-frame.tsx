"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, CircleHelp, Trophy, Asterisk } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
export function MiniGameFrame({
  title,
  number,
  kicker,
  description,
  help,
  toolbar,
  stats,
  note,
  children,
  onHelpChange,
}: {
  title: string;
  number: string;
  kicker: string;
  description: string;
  help: React.ReactNode;
  toolbar: React.ReactNode;
  stats: React.ReactNode;
  note: { title: string; body: string };
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
      <div className="game-breadcrumb">
        <Link href="/#games">
          <ChevronLeft size={15} /> Back to the arcade
        </Link>
        <span>{number} / A LITTLE ESCAPE</span>
      </div>
      <div className="game-heading">
        <div>
          <div className="eyebrow orange-text">{kicker}</div>
          <h1>
            {title}
            <span className="orange-text">.</span>
          </h1>
          <p>{description}</p>
        </div>
        <Button variant="outline" size="small" onClick={() => change(true)}>
          <CircleHelp size={16} /> How to play
        </Button>
      </div>
      <div className="game-workspace">
        <div className="mini-toolbar">{toolbar}</div>
        <div className="play-layout">
          <div className="mini-play-area">{children}</div>
          <aside className="game-sidebar">
            <div className="run-card">
              <span className="eyebrow">YOUR LITTLE JOURNEY</span>
              {stats}
            </div>
            <div className="explorer-note">
              <span className="note-icon">
                <Asterisk size={23} />
              </span>
              <h3>{note.title}</h3>
              <p>{note.body}</p>
            </div>
            <p className="timer-policy">
              Made for a little focus, at your own pace. Your personal best
              stays in this browser.
            </p>
          </aside>
        </div>
      </div>
      <div className="below-game">
        <span>✳</span> A small game. A well-earned break.
      </div>
      <Dialog
        open={showHelp}
        onOpenChange={change}
        title={`A little guide to ${title}.`}
        description="A few simple rules. Plenty of room to play."
      >
        <div className="help-content">{help}</div>
        <Button onClick={() => change(false)}>Got it. Let’s play.</Button>
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
  label,
  value,
}: {
  label?: string;
  value: string | number | null;
}) {
  return (
    <div className="personal-best">
      <Trophy size={15} />
      <span>
        {label ?? "Personal best"} · {value ?? "Your first adventure awaits"}
      </span>
    </div>
  );
}
