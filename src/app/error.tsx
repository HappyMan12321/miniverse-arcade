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
      <h1>Unable to load game</h1>
      <p>Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
