import Link from "next/link";
import AuthErrorNotice from "@/components/AuthErrorNotice";

export const metadata = { title: "Sign-in error — Forex Trading Roadmap" };

export default function AuthErrorPage({ searchParams }) {
  const code = searchParams?.error;

  return (
    <div className="wrap auth-page">
      <div className="auth-card">
        <div className="eyebrow eyebrow-error">
          <span className="dot" aria-hidden="true"></span> LEARNING TERMINAL —
          ACCESS
        </div>
        <h1 className="auth-title">Sign-in didn&apos;t go through</h1>

        <AuthErrorNotice code={code} />

        <Link href="/auth/signin" className="google-btn as-link">
          Try again
        </Link>
        <Link href="/" className="auth-guest-link">
          Continue as a guest instead →
        </Link>
      </div>
    </div>
  );
}
