"use client";

import { useSession, signOut } from "next-auth/react";
import { useProgress } from "@/hooks/useProgress";
import ThemeSelector from "./ThemeSelector";
import GoogleSignInButton from "./GoogleSignInButton";

export default function SettingsApp() {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user;
  const { checked, reset, loaded } = useProgress();

  const doneCount = Object.values(checked).filter(Boolean).length;

  function handleReset() {
    const scope = signedIn ? "for your account" : "in this browser";
    const ok = confirm(
      `This clears every checked item ${scope}. This cannot be undone. Reset progress?`
    );
    if (ok) reset();
  }

  function handleExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: signedIn ? session.user.email : "guest",
      checked,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forex-roadmap-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="wrap">
      <div className="eyebrow">
        <span className="dot" aria-hidden="true"></span> LEARNING TERMINAL —
        SETTINGS
      </div>
      <h1>Account &amp; Settings</h1>
      <p className="sub">
        Manage how the roadmap looks, and control your saved progress.
      </p>

      <section className="settings-section">
        <h2 className="settings-heading">Account</h2>
        {signedIn ? (
          <div className="account-row">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="account-avatar"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div>
              <div className="account-name">{session.user.name}</div>
              <div className="account-email">{session.user.email}</div>
            </div>
            <button className="signin-btn" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="account-row account-row-guest">
            <div>
              <div className="account-name">Browsing as a guest</div>
              <div className="account-email">
                Settings and progress are saved in this browser only.
              </div>
            </div>
            <GoogleSignInButton callbackUrl="/settings" />
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2 className="settings-heading">Appearance</h2>
        <p className="settings-desc">
          Choose how the roadmap looks. &quot;System&quot; follows your
          device&apos;s setting automatically.
        </p>
        <ThemeSelector />
      </section>

      <section className="settings-section">
        <h2 className="settings-heading">Your data</h2>
        <p className="settings-desc">
          {loaded
            ? `${doneCount} concept${doneCount === 1 ? "" : "s"} checked off so far.`
            : "Loading your progress…"}
        </p>
        <div className="settings-actions">
          <button className="signin-btn" onClick={handleExport}>
            Export progress as JSON
          </button>
          <button className="reset-btn" onClick={handleReset}>
            Reset all progress
          </button>
        </div>
      </section>
    </div>
  );
}
