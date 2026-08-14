import Link from 'next/link';
import { siteConfig } from '@/config/site';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
          {siteConfig.shortName}
        </p>
        <h1 className="text-5xl font-bold text-foreground mb-2 tracking-tight">
          404
        </h1>
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Page not found
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}