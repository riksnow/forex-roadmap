"use client";

import { useState } from "react";

// Change this if the number ever changes — it's the only place it's defined.
const MPESA_NUMBER = "0706258077";

export default function DonateButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(MPESA_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Clipboard API can be blocked (older browsers, permissions, non-HTTPS
      // in some setups). The number is still visible to copy by hand.
    }
  }

  return (
    <>
      <button className="donate-btn" onClick={() => setOpen(true)}>
        ☕ Support this project
      </button>

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button
              className="modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3>Support this project</h3>
            <p className="modal-text">
              This roadmap is free to use. If it&apos;s helped your trading
              journey, you can send a contribution directly via M-Pesa.
            </p>
            <div className="mpesa-box">
              <div>
                <span className="mpesa-label">Send Money to</span>
                <span className="mpesa-number">{MPESA_NUMBER}</span>
              </div>
              <button className="copy-btn" onClick={copyNumber}>
                {copied ? "Copied ✓" : "Copy number"}
              </button>
            </div>
            <ol className="mpesa-steps">
              <li>Open M-Pesa on your phone</li>
              <li>
                Select <strong>Send Money</strong>
              </li>
              <li>
                Enter <strong>{MPESA_NUMBER}</strong>
              </li>
              <li>Enter your amount and confirm with your PIN</li>
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}
