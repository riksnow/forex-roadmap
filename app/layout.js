import "./globals.css";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import Providers from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "Forex Trading Roadmap",
  description:
    "A complete, sourced curriculum for learning forex trading — from first principles to professional-grade concepts. Track your progress, sign in to sync it anywhere.",
};

export default function RootLayout({ children }) {
  // Read the theme cookie ThemeProvider writes on every change (see
  // components/ThemeProvider.js). This lets the very first byte of HTML
  // already carry the right theme — no waiting on a client-side fetch to
  // MongoDB (signed-in) or a script reading localStorage (guest) before it
  // looks correct. Only the very first visit on a brand-new browser/device
  // (no cookie yet) still briefly shows the default until the client syncs
  // it — everything after that is instant.
  const cookieTheme = cookies().get("forex-roadmap-theme")?.value;
  const initialTheme =
    cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : undefined;

  return (
    <html
      lang="en"
      data-theme={initialTheme}
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var t = localStorage.getItem('forex-roadmap-theme');
              if (t === 'light' || t === 'dark') {
                document.documentElement.setAttribute('data-theme', t);
              }
            } catch (e) {}
          `}
        </Script>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
