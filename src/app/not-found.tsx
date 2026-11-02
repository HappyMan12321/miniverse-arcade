import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container empty-page">
      <h1>Page not found</h1>
      <p>This page is unavailable.</p>
      <Link href="/" className="button button-primary">
        Back to the arcade
      </Link>
    </main>
  );
}
