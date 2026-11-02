"use client";
import { useEffect, useRef, useState } from "react";
import { ActiveClock } from "./clock";
export function useTimer(active: boolean, resetKey: string) {
  const clock = useRef(new ActiveClock()),
    [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    clock.current.reset();
  }, [resetKey]);
  useEffect(() => {
    const activeClock = clock.current;
    const sync = () => {
      if (active && !document.hidden) activeClock.start();
      else activeClock.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      activeClock.pause();
    };
  }, [active, resetKey]);
  useEffect(() => {
    const id = setInterval(() => setElapsed(clock.current.read()), 80);
    return () => clearInterval(id);
  }, []);
  return {
    elapsed,
    read: () => clock.current.read(),
    reset: () => clock.current.reset(),
  };
}
