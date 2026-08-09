const ERROR_MESSAGES = {
  Configuration:
    "The server isn't configured correctly. If you're the site owner, double-check the environment variables in .env.local.",
  AccessDenied:
    "Access was denied for that Google account. Try a different account, or contact the site owner.",
  Verification: "That sign-in link is no longer valid. Please try again.",
  OAuthSignin: "Couldn't start the Google sign-in flow. Please try again.",
  OAuthCallback:
    "Google sign-in itself succeeded, but the app couldn't finish setting up your session — this is almost always the app failing to reach its database (MongoDB), not a problem with your Google account. Check your connection and try again in a moment.",
  OAuthCreateAccount:
    "Couldn't create an account from your Google profile. Please try again.",
  EmailCreateAccount: "Couldn't create an account. Please try again.",
  Callback:
    "Something went wrong completing sign-in — this is almost always the app failing to reach its database (MongoDB), not a problem with your Google account. Check your connection and try again in a moment.",
  OAuthAccountNotLinked:
    "That email is already linked to a different sign-in method.",
  SessionRequired: "Please sign in to continue.",
  Default: "Something went wrong while signing in. Please try again.",
};

export default function AuthErrorNotice({ code }) {
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.Default;
  return (
    <div className="auth-error">
      <span className="auth-error-code">{code || "Error"}</span>
      <p>{message}</p>
    </div>
  );
}
