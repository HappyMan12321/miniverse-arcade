"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main id="main" className="container empty-page">
      <span className="eyebrow orange-text">A LITTLE DETOUR</span>
      <h1>Let’s find our way back.</h1>
      <p>Something interrupted this adventure. Give it another try.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
