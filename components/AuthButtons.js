"use client";

import { signIn, signOut } from "next-auth/react";

export default function AuthButtons({ session }) {
  if (session?.user) {
    const firstName = (session.user.name || "Trader").split(" ")[0];
    return (
      <div className="auth-box">
        <span className="user-chip" title={session.user.email || ""}>
          {session.user.image ? (
            // Plain <img>, not next/image — avoids needing to allow-list
            // Google's avatar CDN in next.config.js just for one small icon.
            <img
              src={session.user.image}
              alt=""
              className="user-avatar"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <span className="user-name">{firstName}</span>
        </span>
        <button className="signin-btn" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button className="signin-btn primary" onClick={() => signIn("google")}>
      Sign in with Google
    </button>
  );
}
