import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AuthErrorNotice from "@/components/AuthErrorNotice";

export const metadata = { title: "Sign in — Forex Trading Roadmap" };

export default function SignInPage({ searchParams }) {
  const callbackUrl = searchParams?.callbackUrl || "/";
  const error = searchParams?.error;

  return (
    <div className="wrap auth-page">
      <div className="auth-card">
        <div className="eyebrow">
          <span className="dot" aria-hidden="true"></span> LEARNING TERMINAL —
          ACCESS
        </div>
        <h1 className="auth-title">Sign in</h1>
        <p className="sub">
          Sign in with Google to sync your roadmap progress across devices.
          You can also skip this — the roadmap works fully as a guest, with
          progress saved in this browser instead.
        </p>

        {error ? <AuthErrorNotice code={error} /> : null}

        <GoogleSignInButton callbackUrl={callbackUrl} />

        <Link href="/" className="auth-guest-link">
          Continue as a guest instead →
        </Link>
      </div>
    </div>
  );
}
