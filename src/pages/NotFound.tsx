import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center text-center px-4">
      <div>
        <h1 className="font-display text-6xl mb-4">404</h1>
        <p className="text-muted-foreground mb-6">This page wandered off.</p>
        <Link to="/" className="text-primary hover:underline">Return home</Link>
      </div>
    </div>
  );
}