"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";

const ThemeContext = createContext(null);
const LOCAL_KEY = "forex-roadmap-theme";
const VALID = ["dark", "light", "system"];

function applyToDom(value) {
  if (value === "light" || value === "dark") {
    document.documentElement.setAttribute("data-theme", value);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  // Mirror the resolved theme into a cookie (separate from the localStorage/
  // MongoDB "source of truth") purely so the server can read it synchronously
  // on the next request and render the correct theme immediately — see
  // app/layout.js. This is what actually kills the load-time flash/delay.
  try {
    if (value === "light" || value === "dark") {
      document.cookie = `forex-roadmap-theme=${value}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = "forex-roadmap-theme=; path=/; max-age=0; SameSite=Lax";
    }
  } catch (e) {
    // ignore (cookies disabled, etc.)
  }
}

export function ThemeProvider({ children }) {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user;

  const [theme, setThemeState] = useState("system");
  const [loaded, setLoaded] = useState(false);
  const persistRef = useRef(() => {});

  const persist = useCallback(
    (value) => {
      if (signedIn) {
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: value }),
        }).catch(() => {});
      } else {
        try {
          localStorage.setItem(LOCAL_KEY, value);
        } catch (e) {
          // ignore (private browsing / storage disabled)
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

    function readLocal() {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        return VALID.includes(raw) ? raw : null;
      } catch (e) {
        return null;
      }
    }

    async function load() {
      let value = "system";

      if (signedIn) {
        let remoteTheme = null;
        try {
          const res = await fetch("/api/settings");
          const data = await res.json();
          remoteTheme = VALID.includes(data.theme) ? data.theme : null;
        } catch (e) {
          remoteTheme = null;
        }

        if (remoteTheme) {
          value = remoteTheme;
        } else {
          // No saved preference on the account yet — migrate a guest
          // choice from this browser, if there is one.
          const localVal = readLocal();
          if (localVal) {
            value = localVal;
            persistRef.current(localVal);
          }
        }
      } else {
        value = readLocal() || "system";
      }

      if (!cancelled) {
        setThemeState(value);
        applyToDom(value);
        setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [signedIn, status]);

  const setTheme = useCallback((value) => {
    if (!VALID.includes(value)) return;
    setThemeState(value);
    applyToDom(value);
    persistRef.current(value);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return ctx;
}
