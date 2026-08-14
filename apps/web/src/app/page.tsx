import { redirect } from 'next/navigation';

/**
 * Root page — redirects to dashboard.
 * Middleware/layout guards will redirect to /login if not authenticated.
 */
export default function RootPage() {
  redirect('/dashboard');
}