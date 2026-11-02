import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container empty-page">
      <span className="eyebrow orange-text">OFF THE BEATEN PATH</span>
      <h1>A little too lost?</h1>
      <p>This corner of the universe doesn’t exist yet.</p>
      <Link href="/" className="button button-primary">
        Back to the arcade
      </Link>
    </main>
  );
}
