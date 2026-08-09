"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const LOCAL_KEY = "forex-roadmap-progress-guest";

/**
 * Single source of truth for "which roadmap items has this person checked off".
 *
 * - Signed out: stored in localStorage on this device only.
 * - Signed in: stored in MongoDB via /api/progress, synced across devices.
 * - The first time someone signs in, if their account has no saved progress
 *   yet but this browser has guest progress, we migrate it up automatically.
 */
export function useProgress() {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user;

  const [checked, setChecked] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Kept in a ref so `toggle`/`reset` always persist with the *current*
  // signed-in state, even though they're created once via useCallback.
  const persistRef = useRef(() => {});

  const persist = useCallback(
    (next) => {
      if (signedIn) {
        fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checked: next }),
        }).catch(() => {
          // Best-effort: a failed save shouldn't crash the UI. The next
          // successful toggle will retry with the latest state.
        });
      } else {
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        } catch (e) {
          // Storage can fail in private browsing / storage-full states.
        }
      }
    },
    [signedIn]
  );

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;

    async function load() {
      if (signedIn) {
        let dbChecked = {};
        try {
          const res = await fetch("/api/progress");
          const data = await res.json();
          dbChecked = data.checked || {};
        } catch (e) {
          dbChecked = {};
        }

        // First sign-in migration: push local guest progress into the
        // account if the account is otherwise empty.
        if (Object.keys(dbChecked).length === 0) {
          try {
            const raw = localStorage.getItem(LOCAL_KEY);
            const guest = raw ? JSON.parse(raw) : {};
            if (Object.keys(guest).length > 0) {
              dbChecked = guest;
              persistRef.current(guest);
            }
          } catch (e) {
            // ignore malformed local data
          }
        }

        if (!cancelled) setChecked(dbChecked);
      } else {
        let local = {};
        try {
          const raw = localStorage.getItem(LOCAL_KEY);
          local = raw ? JSON.parse(raw) : {};
        } catch (e) {
          local = {};
        }
        if (!cancelled) setChecked(local);
      }
      if (!cancelled) setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [signedIn, status]);

  const toggle = useCallback((id, value) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: value };
      persistRef.current(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setChecked({});
    persistRef.current({});
  }, []);

  return { checked, toggle, reset, loaded, signedIn };
}
