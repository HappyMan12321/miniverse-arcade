"use client";
import { useEffect, useState, useCallback } from "react";
import { readBest, saveBest } from "./storage";
export function useBest(key: string, order: "low" | "high" = "high") {
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setBest(readBest(key)), 0);
    return () => clearTimeout(id);
  }, [key]);
  const record = useCallback(
    (value: number) => setBest(saveBest(key, value, order)),
    [key, order],
  );
  return { best, record };
}
