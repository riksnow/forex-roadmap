import DonateButton from "./DonateButton";

export default function Footer() {
  return (
    <footer className="site-footer">
      <p>
        Educational reference only — not financial advice. Verify current
        spreads, leverage, and regulatory status directly with any broker
        before funding an account.
      </p>
      {/* <DonateButton /> */}
      <p className="footer-fine">
        Progress syncs to your account when you&apos;re signed in with
        Google, or stays in this browser as a guest.
      </p>
    </footer>
  );
}
